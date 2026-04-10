# Kimi K2.5 Integration

The AI backbone of JobButler is a **three-stage pipeline** powered by the Kimi K2.5 model (`moonshot-v1-128k`). All three stages are implemented in `server/services/kimiService.js` and called sequentially from `TailorController`.

---

## API Setup

**Base URL:** `https://api.moonshot.cn/v1`
**Auth Header:** `Authorization: Bearer $KIMI_API_KEY`
**Endpoint:** `POST /chat/completions`
**Model:** `moonshot-v1-128k` (128k context window)

The Kimi API is OpenAI-compatible. Use the `openai` npm package pointed at the Kimi base URL, or make raw `fetch`/`axios` calls.

```js
// server/services/kimiService.js — client setup
import OpenAI from 'openai';

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
});

const MODEL = process.env.KIMI_MODEL || 'moonshot-v1-128k';
```

---

## Pipeline Overview

```
jobDescriptionRaw
       │
       ▼
┌─────────────────────┐
│  Stage 1: Extract   │  → extractedKeywords (JSON)
│  Keywords           │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Stage 2: Select    │  → selectedExperienceIds[] (JSON)
│  Experiences        │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Stage 3: Rewrite   │  → rewrittenMap { [_id]: string[] } (JSON)
│  Bullet Points      │
└─────────────────────┘
       │
       ▼
  LaTeX Builder
```

---

## Stage 1: Keyword Extraction

**Function:** `kimiService.extractKeywords(jobDescriptionRaw)`

**Purpose:** Identify the most important technical and soft skills from the job description so they can be used as a scoring rubric in Stage 2 and as rewriting targets in Stage 3.

### System Prompt

```
You are a technical recruiting expert. Your task is to analyze a job description and extract structured keywords.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "hardSkills": string[],      // Technical tools, languages, frameworks, platforms (e.g. "Node.js", "PostgreSQL", "Kubernetes")
  "softSkills": string[],      // Behavioral/interpersonal skills (e.g. "collaboration", "ownership", "communication")
  "roleKeywords": string[],    // Domain concepts and responsibilities (e.g. "distributed systems", "API design", "system design")
  "seniorityLevel": string     // One of: "entry", "mid", "senior", "staff", "principal", "manager", "director", "unknown"
}

Rules:
- hardSkills: 5–15 items, ordered by prominence in the JD
- softSkills: 3–8 items
- roleKeywords: 5–10 items
- seniorityLevel: infer from title, years-of-experience requirements, and responsibilities described
- Use the exact terminology from the job description where possible (do not normalize "Postgres" to "PostgreSQL")
- Do not include company name, location, salary, or benefits information
```

### User Message Template
```
Analyze this job description and extract keywords:

<job_description>
{{jobDescriptionRaw}}
</job_description>
```

### Expected Response Schema
```json
{
  "hardSkills": ["Node.js", "PostgreSQL", "Kubernetes", "gRPC", "Redis"],
  "softSkills": ["ownership", "communication", "collaboration"],
  "roleKeywords": ["distributed systems", "API design", "microservices", "observability"],
  "seniorityLevel": "senior"
}
```

### Implementation Notes
- Parse with `JSON.parse()`. If parsing fails, retry once with a stricter prompt appended: `"Your previous response was not valid JSON. Return ONLY the JSON object, nothing else."`
- If retry also fails, throw `KimiParseError` — the controller will return `502 kimi_api_error`.
- Keep `temperature: 0.1` for deterministic, consistent extraction.

---

## Stage 2: Experience Selection

**Function:** `kimiService.selectExperiences(extractedKeywords, experiences)`

**Purpose:** Choose which `MasterExperience` entries to include in the resume. A typical tailored resume fits 4–6 experience items (excluding education and skills). Kimi selects based on keyword overlap and relevance to the role.

### Serializing Experiences for Context

Before calling Kimi, serialize `MasterExperience` docs to a compact JSON array. Include only fields relevant to selection (omit internal fields):

```js
function serializeForSelection(experiences) {
  return experiences.map(exp => ({
    id: exp._id.toString(),
    type: exp.type,
    title: exp.title,
    organization: exp.organization || '',
    tags: exp.tags,
    bulletSummary: exp.bullets.slice(0, 2).map(b => b.text),  // first 2 bullets only
  }));
}
```

### System Prompt

```
You are a resume optimization expert. You will be given:
1. A set of keywords extracted from a target job description
2. A list of experience entries from a candidate's master resume

Your task is to select the experiences that best match the job requirements.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "selectedIds": string[],    // Array of experience entry "id" values to include
  "rationale": string         // 1–2 sentence explanation of your selection strategy
}

Rules:
- Select 3–6 entries of type "work" or "project" combined (never select 0 work entries if any exist)
- ALWAYS include ALL entries of type "education" — do not filter them
- ALWAYS include ALL entries of type "skill" — do not filter them
- For work/project selection: prioritize entries whose tags overlap with hardSkills and roleKeywords
- Prefer more recent entries (higher priority number = older, lower priority = newer)
- If the candidate has fewer than 3 work/project entries total, select all of them
- selectedIds must only contain id values from the provided experience list
```

### User Message Template
```
Target role keywords:
<keywords>
{{JSON.stringify(extractedKeywords, null, 2)}}
</keywords>

Candidate experience entries:
<experiences>
{{JSON.stringify(serializedExperiences, null, 2)}}
</experiences>

Select the most relevant experiences for this role.
```

### Expected Response Schema
```json
{
  "selectedIds": ["665a1234...", "665b5678...", "665c9abc..."],
  "rationale": "Selected the two backend engineering roles and the distributed systems project due to strong overlap with Node.js, PostgreSQL, and microservices keywords. Education and skills entries are always included."
}
```

### Implementation Notes
- Validate that every ID in `selectedIds` exists in the original experience array. Silently drop invalid IDs.
- Ensure education and skill entries are always appended to `selectedIds` regardless of Kimi's output (safety guarantee).
- Keep `temperature: 0.2` — slight variation is acceptable, but mostly deterministic.

---

## Stage 3: Bullet Point Rewriting

**Function:** `kimiService.rewriteBullets(selectedExperiences, extractedKeywords)`

**Purpose:** Rewrite the bullet points for each selected `work` and `project` entry to better reflect the language and priorities of the target role. Education and skill entries are **not** rewritten — they are passed through as-is.

### System Prompt

```
You are an expert technical resume writer. You will be given:
1. A set of keywords from a target job description
2. A list of selected experience entries with their original bullet points

Rewrite the bullet points for each "work" and "project" entry to better match the target role.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "[experience_id]": string[]   // Rewritten bullets for that experience entry
}

Rules for each rewritten bullet:
- Start with a strong past-tense action verb (e.g. "Engineered", "Architected", "Optimized", "Led", "Designed")
- Incorporate relevant keywords from the target role naturally — do not keyword-stuff
- Preserve any quantified metrics from the original (numbers, percentages, dollar amounts) — never fabricate metrics
- Each bullet must be 15–100 characters long
- Produce exactly 2–4 bullets per entry (trim or expand from the original as needed)
- Do not add fictional accomplishments or technologies the original bullet does not reference
- Return the experience id as the key exactly as provided (no modification)
- Only include entries of type "work" or "project" in the output — omit education and skill entries
```

### User Message Template
```
Target role keywords:
<keywords>
{{JSON.stringify(extractedKeywords, null, 2)}}
</keywords>

Experience entries to rewrite:
<experiences>
{{JSON.stringify(workAndProjectEntries, null, 2)}}
</experiences>

Rewrite the bullet points for each experience to better match this role.
```

### Expected Response Schema
```json
{
  "665a1234...": [
    "Architected RESTful microservices in Node.js serving 2M+ daily requests",
    "Optimized PostgreSQL query performance, reducing p99 latency by 40%",
    "Designed distributed caching layer with Redis, improving throughput by 3x"
  ],
  "665b5678...": [
    "Engineered real-time data pipeline using gRPC and Kafka for 500k events/day",
    "Led system design reviews and established observability standards across 4 teams"
  ]
}
```

### Implementation Notes
- If Kimi returns bullets that are too long (>120 chars), truncate at the last word boundary before 120 chars — do not silently pass them to the LaTeX builder (risks line overflow).
- If the response JSON is missing an expected ID key, fall back to the original bullets for that entry.
- Keep `temperature: 0.4` — more creative variation is acceptable here to produce natural-sounding rewrites.

---

## Full `kimiService.js` Function Signatures

```js
/**
 * Stage 1: Extract keywords from a job description.
 * @param {string} jobDescriptionRaw
 * @returns {Promise<{ hardSkills: string[], softSkills: string[], roleKeywords: string[], seniorityLevel: string }>}
 */
export async function extractKeywords(jobDescriptionRaw) {}

/**
 * Stage 2: Select the most relevant experience entries.
 * @param {{ hardSkills: string[], softSkills: string[], roleKeywords: string[], seniorityLevel: string }} keywords
 * @param {Array<MasterExperience>} experiences  — full Mongoose docs
 * @returns {Promise<string[]>}  — array of ObjectId strings (always includes all education + skill IDs)
 */
export async function selectExperiences(keywords, experiences) {}

/**
 * Stage 3: Rewrite bullet points for work/project entries.
 * @param {Array<MasterExperience>} selectedExperiences  — only work/project types
 * @param {{ hardSkills: string[], softSkills: string[], roleKeywords: string[], seniorityLevel: string }} keywords
 * @returns {Promise<Object.<string, string[]>>}  — map of experience _id → rewritten bullets
 */
export async function rewriteBullets(selectedExperiences, keywords) {}
```

---

## Error Handling Strategy

| Error | Cause | Handling |
|---|---|---|
| `KimiParseError` | JSON.parse fails on Kimi response | Retry once with stricter prompt; throw on second failure |
| `KimiAPIError` | HTTP 4xx/5xx from Kimi API | Throw immediately (no retry); controller returns `502` |
| Missing bullet IDs | Stage 3 returns fewer IDs than expected | Fall back to original bullets for missing IDs |
| Invalid selected IDs | Stage 2 returns IDs not in experience list | Silently drop invalid IDs; warn in server log |
| Stage 3 over-long bullets | Bullet exceeds 120 chars | Truncate at last word boundary |

---

## Token Budget

The 128k context window is large, but stage 2 can hit limits with extensive master profiles.

| Stage | Typical Input Tokens | Max Input Tokens | Notes |
|---|---|---|---|
| Stage 1 (keyword extraction) | 300–2,000 | 5,000 | JD only |
| Stage 2 (experience selection) | 1,000–8,000 | 20,000 | JD keywords + serialized experiences |
| Stage 3 (bullet rewriting) | 800–5,000 | 15,000 | Selected experiences + keywords |

**Chunking strategy for large profiles (>50 experience entries):**
- Stage 2 only: group experiences into batches of 20 by `type`, run selection per batch, then merge and take top N.
- This is an edge case; most users will have 10–20 entries.

---

## Rate Limits & Costs

- Moonshot AI rate limits vary by tier — check your dashboard at `platform.moonshot.cn`.
- Implement a simple in-memory queue (or use `bottleneck` npm package) if concurrent tailoring requests are expected.
- Each tailoring session makes 3 API calls. With typical token counts, a session costs roughly 10,000–30,000 tokens total.
