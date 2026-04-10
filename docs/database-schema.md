# Database Schema

JobButler uses **MongoDB 7** with **Mongoose 8**. All collections live in the same database (name configurable via `MONGODB_URI`).

---

## Collections

### `users`

Stores authentication credentials. No personal data beyond email is stored at the user level — all profile content lives in `masterexperiences`.

```js
// server/models/User.js
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    required: true,   // bcrypt hash, never store plaintext
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});
```

**Indexes:**
- `{ email: 1 }` — unique index (auto-created by `unique: true`)

---

### `masterexperiences`

The central model. Each document represents one entry on the user's "master resume" — a job, project, education item, or skill block. Users build this list once; it is the input to every tailoring session.

```js
// server/models/MasterExperience.js
const BulletSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 300 },
}, { _id: false });

const MasterExperienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['work', 'project', 'education', 'skill'],
    required: true,
  },

  // --- Display fields ---
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    // Examples: "Software Engineer", "Full-Stack E-Commerce Platform", "B.S. Computer Science"
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 120,
    // For work/education: company or university name.
    // For projects: leave blank or use a short descriptor ("Personal Project").
    // For skills: leave blank.
  },
  location: {
    type: String,
    trim: true,
    maxlength: 80,
    // e.g. "San Francisco, CA" or "Remote". Optional.
  },
  startDate: {
    type: String,
    trim: true,
    maxlength: 20,
    // Free-form string to match LaTeX output: "Jan 2022", "2021", "Present".
    // Not a Date type — avoids timezone issues and matches resume display conventions.
  },
  endDate: {
    type: String,
    trim: true,
    maxlength: 20,
    // Same convention as startDate. Use "Present" for current roles.
  },

  // --- Content fields ---
  bullets: {
    type: [BulletSchema],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 8,
      message: 'Maximum 8 raw bullets per experience entry',
    },
    // Raw, unoptimized bullet points. Kimi will rewrite a subset of these.
  },
  tags: {
    type: [String],
    default: [],
    // Keywords the user associates with this entry.
    // Examples: ["React", "TypeScript", "REST API", "team lead"]
    // Used by Kimi's selection stage to score relevance against the JD.
  },

  // --- Metadata ---
  priority: {
    type: Number,
    default: 0,
    // Lower number = higher priority. Used to determine display order and
    // to break ties when Kimi selects between similarly-scored experiences.
  },
  visible: {
    type: Boolean,
    default: true,
    // Set to false to soft-hide an entry without deleting it.
    // Hidden entries are never sent to the Kimi pipeline.
  },
}, {
  timestamps: true,
});
```

**Indexes:**
- `{ userId: 1, type: 1 }` — compound index for fetching all entries of a given type for a user
- `{ userId: 1, priority: 1 }` — compound index for ordered fetch
- `{ userId: 1, visible: 1 }` — compound index for filtering hidden entries

**Field Notes:**
- `type: 'skill'` entries typically have no `organization`, `startDate`, or `endDate`. Their `bullets` array contains skill-line strings (e.g. `"Languages: Python, TypeScript, Go"`), and the LaTeX builder renders them as a special Skills section.
- `type: 'education'` entries use `title` for the degree name and `organization` for the institution.

---

### `tailoringsessions`

Persists the full audit trail of each AI-tailoring run. Enables the Session History page and prevents duplicate API calls for the same JD.

```js
// server/models/TailoringSession.js
const TailoringSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // --- Job description inputs ---
  jobTitle: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  company: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  jobDescriptionRaw: {
    type: String,
    required: true,
    maxlength: 20000,  // ~5k tokens; enforced before sending to Kimi
  },

  // --- AI pipeline outputs ---
  extractedKeywords: {
    hardSkills:    { type: [String], default: [] },
    softSkills:    { type: [String], default: [] },
    roleKeywords:  { type: [String], default: [] },
    seniorityLevel: { type: String, default: '' },
  },
  selectedExperienceIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MasterExperience' }],
    default: [],
  },

  // --- Generated content ---
  generatedLatex: {
    type: String,
    // Full .tex document string. May be several KB.
  },
  pdfStoragePath: {
    type: String,
    default: null,
    // Absolute filesystem path or S3 key. Null if PDF was streamed but not saved.
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});
```

**Indexes:**
- `{ userId: 1, createdAt: -1 }` — for Session History page (most recent first)

---

## Entity Relationships

```
User (1) ──── (many) MasterExperience
User (1) ──── (many) TailoringSession
TailoringSession (many) ──── (many) MasterExperience   [via selectedExperienceIds array]
```

There are no `$lookup` joins at runtime — the backend fetches `MasterExperience` docs by `userId`, serializes them, and sends them to Kimi. The `selectedExperienceIds` array on `TailoringSession` is stored for audit/history purposes only.

---

## Seed Data Structure

The seed script (`server/scripts/seed.js`) creates one test user and a representative set of `MasterExperience` documents:

```js
// Minimum viable seed — one entry per type
const seedData = [
  // type: 'work'
  { type: 'work', title: 'Software Engineer', organization: 'Acme Corp',
    startDate: 'Jun 2023', endDate: 'Present', location: 'Remote',
    bullets: ['Built REST APIs with Node.js and Express', 'Reduced API latency by 40% via Redis caching'],
    tags: ['Node.js', 'Express', 'Redis', 'REST API'], priority: 1 },

  // type: 'project'
  { type: 'project', title: 'JobButler', organization: 'Personal Project',
    startDate: 'Jan 2025', endDate: 'Present',
    bullets: ['Developed AI-driven resume tailoring system using Kimi K2.5', 'Built LaTeX PDF compilation pipeline with TeX Live'],
    tags: ['React', 'Node.js', 'MongoDB', 'AI', 'LaTeX'], priority: 2 },

  // type: 'education'
  { type: 'education', title: 'B.S. Computer Science', organization: 'State University',
    startDate: 'Sep 2019', endDate: 'May 2023', location: 'City, ST',
    bullets: ['GPA: 3.8/4.0', 'Relevant coursework: Algorithms, Distributed Systems, ML'],
    tags: [], priority: 3 },

  // type: 'skill'
  { type: 'skill', title: 'Technical Skills',
    bullets: [
      'Languages: JavaScript, TypeScript, Python, Go',
      'Frameworks: React, Express, FastAPI',
      'Tools: Docker, Git, MongoDB, PostgreSQL',
    ],
    tags: [], priority: 0 },
];
```
