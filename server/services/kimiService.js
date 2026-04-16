import OpenAI from 'openai';

// Custom error classes
export class KimiParseError extends Error {
  constructor(message, response) {
    super(message);
    this.name = 'KimiParseError';
    this.response = response;
  }
}

export class KimiAPIError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'KimiAPIError';
    this.statusCode = statusCode;
  }
}

// Initialize LLM client (Groq-hosted GPT-OSS-120B, OpenAI-compatible)
const llm = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  timeout: 60000, // 60s timeout to prevent hanging requests
});

const DEBUG = process.env.NODE_ENV !== 'production';

const MODEL = process.env.LLM_MODEL || 'moonshotai/kimi-k2-instruct-0905';

/**
 * Parse JSON from Kimi response, handling common formatting issues
 */
function parseKimiJSON(content) {
  // Remove markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return JSON.parse(cleaned.trim());
}

/**
 * Stage 1: Extract keywords from a job description
 * @param {string} jobDescriptionRaw - Full text of the job description
 * @returns {Promise<{hardSkills: string[], softSkills: string[], roleKeywords: string[], seniorityLevel: string}>}
 */
export async function extractKeywords(jobDescriptionRaw) {
  const systemPrompt = `You are a technical recruiting expert. Your task is to analyze a job description and extract structured keywords and core responsibilities.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "hardSkills": string[],           // Technical tools, languages, frameworks, platforms (e.g. "Node.js", "PostgreSQL", "Kubernetes")
  "softSkills": string[],           // Behavioral/interpersonal skills (e.g. "collaboration", "ownership", "communication")
  "roleKeywords": string[],         // Domain concepts and responsibilities (e.g. "distributed systems", "API design", "system design")
  "coreResponsibilities": string[], // 3-5 key responsibility statements directly from or closely paraphrasing the JD
  "seniorityLevel": string          // One of: "entry", "mid", "senior", "staff", "principal", "manager", "director", "unknown"
}

Rules:
- hardSkills: 5–15 items, ordered by prominence in the JD
- softSkills: 3–8 items
- roleKeywords: 5–10 items
- coreResponsibilities: 3–5 items, direct quotes or close paraphrases of the most important duties listed in the JD (e.g. "Design and maintain CI/CD pipelines", "Lead cross-functional engineering team")
- seniorityLevel: infer from title, years-of-experience requirements, and responsibilities described
- Use the exact terminology from the job description where possible (do not normalize "Postgres" to "PostgreSQL")
- Do not include company name, location, salary, or benefits information`;

  const userMessage = `Analyze this job description and extract keywords:

<job_description>
${jobDescriptionRaw}
</job_description>`;

  let response;
  try {
    response = await llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
    });
  } catch (error) {
    console.error('Kimi API error (extractKeywords):', error.message);
    throw new KimiAPIError(`Kimi API error: ${error.message}`, error.status || 502);
  }

  const content = response.choices[0]?.message?.content;
  
  try {
    return parseKimiJSON(content);
  } catch (parseError) {
    console.warn('First parse attempt failed, retrying with stricter prompt...');
    
    // Retry with stricter prompt
    try {
      const retryResponse = await llm.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: content },
          { role: 'user', content: 'Your previous response was not valid JSON. Return ONLY the JSON object, nothing else.' },
        ],
        temperature: 0.0,
      });
      
      return parseKimiJSON(retryResponse.choices[0]?.message?.content);
    } catch (retryError) {
      console.error('Kimi parse error after retry:', retryError.message);
      throw new KimiParseError('Failed to parse keyword extraction response', content);
    }
  }
}

/**
 * Compute a relevance score for an experience against extracted keywords.
 * Tag matches are weighted heavily (3 pts each), bullet keyword hits add 1 pt each.
 */
function scoreExperience(exp, keywords) {
  const hardSkills = (keywords.hardSkills || []).map(s => s.toLowerCase().trim());
  const roleKws = (keywords.roleKeywords || []).map(s => s.toLowerCase().trim());
  const allKeywords = [...hardSkills, ...roleKws];
  let score = 0;

  // Tag matches (strongest signal — 3 points each)
  for (const tag of (exp.tags || [])) {
    const t = tag.toLowerCase().trim();
    if (allKeywords.some(kw => t === kw || t.includes(kw) || kw.includes(t))) {
      score += 3;
    }
  }

  // Bullet text matches (weaker signal — 1 point per keyword found)
  const bulletText = (exp.bullets || []).map(b => (b.text || '').toLowerCase()).join(' ');
  for (const kw of allKeywords) {
    if (bulletText.includes(kw)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Serialize experiences for selection context — includes ALL bullets,
 * dates, priority, and a pre-computed relevanceScore so the LLM can
 * make informed decisions without manually comparing arrays.
 */
function serializeForSelection(experiences, keywords) {
  return experiences.map(exp => ({
    id: exp._id.toString(),
    type: exp.type,
    title: exp.title,
    organization: exp.organization || '',
    startDate: exp.startDate || null,
    endDate: exp.endDate || null,
    priority: exp.priority ?? 0,
    tags: exp.tags || [],
    bullets: (exp.bullets || []).map(b => b.text),
    relevanceScore: scoreExperience(exp, keywords),
  }));
}

/**
 * Stage 2: Select the most relevant experience entries
 * @param {{hardSkills: string[], softSkills: string[], roleKeywords: string[], coreResponsibilities: string[], seniorityLevel: string}} keywords
 * @param {Array} experiences - Full Mongoose documents
 * @param {string} jobDescription - Raw job description text for context
 * @returns {Promise<string[]>} - Array of ObjectId strings
 */
export async function selectExperiences(keywords, experiences, jobDescription = '') {
  const serialized = serializeForSelection(experiences, keywords);

  const systemPrompt = `You are an expert resume strategist. You will be given:
1. Keywords and core responsibilities extracted from a target job description
2. The raw job description for full context
3. A list of experience entries from a candidate's master resume, each with FULL bullet details

Your task is to select the experiences that will create the strongest, most relevant resume for this specific role.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "selectedIds": string[],    // Array of experience entry "id" values to include
  "rationale": string         // 2–3 sentence explanation of your selection strategy and how the selected entries together tell a compelling narrative for this role
}

SELECTION STRATEGY:
1. RELEVANCE SCORE (highest signal): Each experience includes a pre-computed "relevanceScore" based on how many of its tags and bullet keywords match the job's required skills. STRONGLY prefer experiences with higher relevanceScore. A score of 0 means no technology overlap — avoid selecting zero-score entries when higher-scoring alternatives exist.
2. ROLE NATURE MATCH: Evaluate whether each experience describes hands-on technical/engineering work (writing code, building systems, debugging) vs. coordination/management work (leading meetings, managing timelines, writing specs). For software engineering roles, STRONGLY prefer hands-on coding experiences. For PM/management roles, prefer leadership/coordination experiences. The job's seniorityLevel and coreResponsibilities indicate the role nature.
3. Read each experience's FULL bullet list for additional context on what the candidate actually built or accomplished — bullets reveal depth beyond what tags capture.
4. BREADTH: The selected experiences TOGETHER should cover the maximum number of hardSkills from the JD. Don't pick 3 entries that all cover the same skill — spread coverage.
5. RECENCY: Each experience includes startDate, endDate, and priority (lower = more recent). When relevance scores are similar, prefer more recent entries.
6. Consider transferable skills: an experience in a different domain can be relevant if the underlying technical work aligns with the target role.

HARD RULES:
- Select 3–6 entries of type "work" or "project" combined (never select 0 work entries if any exist)
- ALWAYS include ALL entries of type "education" — do not filter them
- ALWAYS include ALL entries of type "skill" — do not filter them
- If the candidate has fewer than 3 work/project entries total, select all of them
- selectedIds must only contain id values from the provided experience list
- When selecting among work/project entries, prefer entries with relevanceScore > 0 over those with relevanceScore = 0
- For software engineering roles (inferred from job title and coreResponsibilities), at least 2 of the selected work/project entries should involve hands-on coding`;

  const userMessage = `TARGET ROLE KEYWORDS AND RESPONSIBILITIES:
<keywords>
${JSON.stringify(keywords, null, 2)}
</keywords>

JOB DESCRIPTION (for full context):
<job_description>
${(jobDescription || '').substring(0, 4000)}
</job_description>

CANDIDATE EXPERIENCE ENTRIES (read ALL bullets carefully):
<experiences>
${JSON.stringify(serialized, null, 2)}
</experiences>

Select the experiences that best position this candidate for the target role. Use the relevanceScore as your primary ranking signal — higher scores mean stronger technology match. For software engineering roles, prioritize entries where the candidate wrote code over entries focused on project management or coordination.`;

  let response;
  try {
    response = await llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
    });
  } catch (error) {
    console.error('Kimi API error (selectExperiences):', error.message);
    throw new KimiAPIError(`Kimi API error: ${error.message}`, error.status || 502);
  }

  const content = response.choices[0]?.message?.content;
  let parsed;
  
  try {
    parsed = parseKimiJSON(content);
  } catch (parseError) {
    console.error('Kimi parse error (selectExperiences):', parseError.message);
    throw new KimiParseError('Failed to parse experience selection response', content);
  }

  // Validate IDs exist in original array
  const validIds = new Set(experiences.map(e => e._id.toString()));
  const selectedIds = (parsed.selectedIds || []).filter(id => validIds.has(id));
  
  // Safety guarantee: Always include all education and skill entries
  experiences.forEach(exp => {
    if ((exp.type === 'education' || exp.type === 'skill') && 
        !selectedIds.includes(exp._id.toString())) {
      selectedIds.push(exp._id.toString());
    }
  });
  
  if (DEBUG) console.log('Selection rationale:', parsed.rationale);

  return selectedIds;
}

// Shared system prompt used for each per-experience rewrite call.
const REWRITE_SYSTEM_PROMPT = `You are an expert resume writer crafting bullet points tailored to a specific job application.

REWRITING PRINCIPLES:
1. Each rewritten bullet should be rooted in the general area of work described by the original bullet — the candidate did work in that domain, and you are presenting it in the best possible light for this specific JD
2. You MAY freely add parent technologies, related technologies, and ecosystem tools that are standard companions to what is mentioned (e.g., if the original mentions Flask, you may say "Python/Flask"; if it mentions React, you may add "JavaScript/TypeScript"; if it mentions PostgreSQL, you may reference "SQL" or "relational databases")
3. You MAY upgrade scope and impact language to sound more impressive — reframe contributions generously (e.g., "contributed to" can become "led development of", "helped with" can become "spearheaded", "worked on" can become "architected and delivered")
4. You MAY reframe the nature of the work using JD terminology even when the match is approximate (e.g., "built backend services" can become "designed and deployed microservices", "processed data" can become "built data pipelines", "wrote tests" can become "established comprehensive testing framework")
5. Do NOT fabricate specific numbers, percentages, dollar amounts, or metrics that were not in the original — if you want to add impact, use qualitative language ("significantly improved", "at scale", "across multiple teams") rather than invented statistics
6. Do NOT invent entirely fictional projects, employers, or job titles — the embellishment should be in HOW the work is described, not WHAT work was done
7. Preserve any specific metrics that ARE present in the originals — do not change "reduced latency by 40%" to a different number

OPTIMIZATION GOALS (actively pursue all of these):
1. REFRAME each bullet's angle to emphasize the aspects most relevant to the target role. The same accomplishment can be framed differently depending on what the job values — lead with what matters to this JD. Be aggressive: if the JD values "system design" and the candidate built any backend feature, frame it as system design work
2. ADOPT JD TERMINOLOGY LIBERALLY — mirror the exact words and phrases from the job description even when the connection to the original bullet is loose. If the JD says "microservices" and the original says "backend services" or even "server-side code", use "microservices". If the JD says "data pipelines" and the original involves any data processing, say "data pipelines". The goal is maximum keyword alignment with the JD
3. EXPAND GENEROUSLY — add plausible context, methodologies, and technical details that would be typical for the type of work described. If someone "built an API", you may describe the design patterns, scalability considerations, and collaboration aspects that such work typically involves. Add parent/related technologies freely
4. STRUCTURE each bullet using the pattern: [Strong action verb] + [What you did / built / led] + [How / with what tools or approach] + [Impact or result — add qualitative impact even if original has none]
5. Start each bullet with a strong, VARIED past-tense action verb — avoid repeating the same verb across bullets. Prefer powerful verbs that convey leadership and ownership: Architected, Engineered, Spearheaded, Optimized, Orchestrated, Pioneered, Championed, Drove, Established, Delivered, Scaled, Transformed, Launched
6. Target 120–180 characters per bullet (approximately 1.5–2 lines on a standard resume)
7. Make each bullet self-contained and impressive — a reader should come away thinking the candidate is a strong match for the role. Add qualitative impact phrases when no metrics exist (e.g., "improving system reliability", "enabling faster iteration across teams", "reducing operational overhead")

OUTPUT:
Return ONLY a JSON array of 3–4 rewritten bullet strings for this single experience entry.
Format: ["bullet1", "bullet2", "bullet3", "bullet4"]

DO NOT include any explanation, markdown, code fences, or wrapping object.`;

/**
 * Rewrite bullets for a single experience via one LLM call.
 * Throws KimiAPIError on network/API failure; returns null on parse failure
 * so the caller can fall back to originals for this one entry.
 */
async function rewriteOneExperience(experience, keywords, jobDescription) {
  const payload = {
    id: experience._id.toString(),
    type: experience.type,
    title: experience.title,
    organization: experience.organization || '',
    bullets: (experience.bullets || []).map(b => b.text),
  };

  const userMessage = `JOB DESCRIPTION (use this to inform your rewriting angle and adopt its terminology):
<job_description>
${(jobDescription || '').substring(0, 4000)}
</job_description>

TARGET JOB KEYWORDS:
${JSON.stringify(keywords, null, 2)}

EXPERIENCE ENTRY TO REWRITE:
${JSON.stringify(payload, null, 2)}

Return a JSON array of 3–4 rewritten bullets for this single entry. Maximize keyword overlap with the JD. Freely upgrade scope, add related technologies, and use the JD's exact terminology. Only constraint: do not invent specific numbers or entirely fictional projects.`;

  const response = await llm.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: REWRITE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.6,
  });

  const content = response.choices[0]?.message?.content;
  if (DEBUG) console.log(`LLM rewrite response for ${payload.id}:`, content?.substring(0, 300));

  try {
    const parsed = parseKimiJSON(content);
    if (Array.isArray(parsed)) return parsed;
    // Tolerate a wrapping object keyed by id (older prompt shape)
    if (parsed && typeof parsed === 'object') {
      const firstValue = parsed[payload.id] ?? Object.values(parsed)[0];
      if (Array.isArray(firstValue)) return firstValue;
    }
    return null;
  } catch (parseError) {
    console.error(`LLM parse error (rewriteBullets, id=${payload.id}):`, parseError.message);
    return null;
  }
}

/**
 * Stage 3: Rewrite bullet points for work/project entries.
 * Fires one LLM call per experience in parallel — reduces Stage 3 latency from
 * sum-of-all to max-of-one.
 *
 * @param {Array} selectedExperiences - Only work/project types
 * @param {{hardSkills: string[], softSkills: string[], roleKeywords: string[], coreResponsibilities: string[], seniorityLevel: string}} keywords
 * @param {string} jobDescription - Raw job description text for context
 * @returns {Promise<Object.<string, string[]>>} - Map of experience _id → rewritten bullets
 */
export async function rewriteBullets(selectedExperiences, keywords, jobDescription = '') {
  const workAndProject = selectedExperiences.filter(
    exp => exp.type === 'work' || exp.type === 'project'
  );

  if (workAndProject.length === 0) {
    return {};
  }

  if (DEBUG) console.log(`Rewriting ${workAndProject.length} experiences in parallel...`);

  // Fan out one call per experience; settle individually so one failure doesn't
  // tank the whole batch. Missing/null results fall back to originals below.
  const outcomes = await Promise.allSettled(
    workAndProject.map(exp => rewriteOneExperience(exp, keywords, jobDescription))
  );

  const result = {};

  workAndProject.forEach((exp, idx) => {
    const id = exp._id.toString();
    const outcome = outcomes[idx];
    let bullets = null;

    if (outcome.status === 'fulfilled' && Array.isArray(outcome.value) && outcome.value.length > 0) {
      bullets = outcome.value;
    } else {
      if (outcome.status === 'rejected') {
        console.warn(`Rewrite failed for ${id}, using originals:`, outcome.reason?.message);
      }
      bullets = (exp.bullets || []).slice(0, 4).map(b => b.text);
    }

    // Truncate long bullets and cap at 4 per entry.
    result[id] = bullets.map(bullet => {
      if (bullet.length > 200) {
        const truncated = bullet.substring(0, 200);
        const lastSpace = truncated.lastIndexOf(' ');
        return lastSpace > 140 ? truncated.substring(0, lastSpace) : truncated;
      }
      return bullet;
    }).slice(0, 4);
  });

  return result;
}

const SAMPLE_BLOCKLIST = [
  'jake ryan',
  'gitlytics',
  'simple paintball',
  'southwestern university',
  'blinn college',
  'sourabh bajaj',
];

function filterSampleContent(experiences) {
  return experiences.filter(exp => {
    const title = (exp.title || '').toLowerCase();
    const org = (exp.organization || '').toLowerCase();
    return !SAMPLE_BLOCKLIST.some(term => title.includes(term) || org.includes(term));
  });
}

/**
 * Parse a resume text into structured MasterExperience objects
 * @param {string} resumeText - Raw text extracted from a PDF resume
 * @returns {Promise<Array>} - Array of parsed experience objects ready to be saved
 */
export async function parseResume(resumeText) {
  const systemPrompt = `You are an expert resume parser. You will be given raw text extracted from a PDF resume.
Your task is to parse and categorize the content into structured experience entries.
If the resume text appears to be a template or sample (e.g. contains placeholder names like Jake Ryan, Sourabh Bajaj, or fake companies like Gitlytics, Simple Paintball, Southwestern University, Blinn College), reject those entries entirely — do not include them in the output.

Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must conform exactly to this schema:
{
  "experiences": [
    {
      "type": string,           // One of: "work", "project", "education", "skill"
      "title": string,          // Job title, degree name, project name, or skill category
      "organization": string,   // Company name, school name, or null for projects/skills
      "location": string,       // City, State or null if not present
      "startDate": string,      // e.g., "Jan 2022" or "2022" or null
      "endDate": string,        // e.g., "Present" or "Dec 2023" or null
      "bullets": string[],      // Achievement bullets (for work/project/education)
      "tags": string[]          // Skills/technologies mentioned (auto-extracted)
    }
  ],
  "personalInfo": {
    "name": string,
    "email": string,
    "phone": string,
    "linkedinUrl": string
  }
}

Rules:
- type "work": Professional employment with job titles, companies, and dates
- type "project": Personal/academic projects with descriptions
- type "education": Degrees, certifications, academic achievements
- type "skill": For skills sections, use categories as title (e.g., "Languages", "Frameworks", "Tools")
  - For skills, put the individual skills as tags, not bullets
  - Only create one entry per skill category/section
- Each bullet should be one accomplishment or responsibility (15-300 chars)
- Extract relevant technology tags from work/project descriptions
- Dates should be in "Month Year" format when possible, or just "Year"
- Use "Present" for current positions
- If you cannot determine a field, use null
- Do NOT fabricate information — only extract what is explicitly stated`;

  const userMessage = `Parse this resume text into structured experience entries:

<resume_text>
${resumeText}
</resume_text>`;

  let response;
  try {
    response = await llm.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
    });
  } catch (error) {
    console.error('LLM API error (parseResume):', error.message);
    throw new KimiAPIError(`LLM API error: ${error.message}`, error.status || 502);
  }

  const content = response.choices[0]?.message?.content;
  
  function normalizeExperiences(rawList) {
    return filterSampleContent(
      (rawList || []).map(exp => ({
        type: ['work', 'project', 'education', 'skill'].includes(exp.type) ? exp.type : 'work',
        title: (exp.title || '').substring(0, 120),
        organization: exp.organization ? exp.organization.substring(0, 120) : null,
        location: exp.location ? exp.location.substring(0, 80) : null,
        startDate: exp.startDate ? exp.startDate.substring(0, 20) : null,
        endDate: exp.endDate ? exp.endDate.substring(0, 20) : null,
        bullets: (exp.bullets || [])
          .filter(b => typeof b === 'string' && b.trim())
          .slice(0, 8)
          .map(b => ({ text: b.substring(0, 300) })),
        tags: (exp.tags || [])
          .filter(t => typeof t === 'string' && t.trim())
          .slice(0, 20),
        priority: 0,
        visible: true,
      }))
    );
  }

  try {
    const parsed = parseKimiJSON(content);

    return {
      experiences: normalizeExperiences(parsed.experiences),
      personalInfo: parsed.personalInfo || {},
    };
  } catch (parseError) {
    console.warn('First parse attempt failed, retrying with stricter prompt...');

    // Retry with stricter prompt
    try {
      const retryResponse = await llm.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: content },
          { role: 'user', content: 'Your previous response was not valid JSON. Return ONLY the JSON object, nothing else.' },
        ],
        temperature: 0.0,
      });

      const retryParsed = parseKimiJSON(retryResponse.choices[0]?.message?.content);

      return {
        experiences: normalizeExperiences(retryParsed.experiences),
        personalInfo: retryParsed.personalInfo || {},
      };
    } catch (retryError) {
      console.error('LLM parse error after retry:', retryError.message);
      throw new KimiParseError('Failed to parse resume text', content);
    }
  }
}

export default {
  extractKeywords,
  selectExperiences,
  rewriteBullets,
  parseResume,
  KimiParseError,
  KimiAPIError,
};
