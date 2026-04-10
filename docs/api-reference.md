# API Reference

Base URL: `http://localhost:3001/api` (development)

All request/response bodies are `application/json` unless noted. Protected routes require:
```
Authorization: Bearer <jwt>
```

---

## Authentication

### `POST /api/auth/register`

Create a new user account.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Validation**
- `email`: required, valid email format
- `password`: required, minimum 8 characters

**Response `201`**
```json
{
  "token": "<jwt>",
  "user": {
    "_id": "664f...",
    "email": "user@example.com",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| `400` | `validation_error` | Missing or invalid fields |
| `409` | `email_taken` | Email already registered |

---

### `POST /api/auth/login`

Authenticate and receive a JWT.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Response `200`**
```json
{
  "token": "<jwt>",
  "user": {
    "_id": "664f...",
    "email": "user@example.com"
  }
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| `400` | `validation_error` | Missing fields |
| `401` | `invalid_credentials` | Email not found or password mismatch |

---

## Master Experiences

All routes require `Authorization: Bearer <jwt>`. Operations are scoped to the authenticated user — users cannot access or modify other users' experiences.

### `GET /api/experiences`

Fetch all visible experience entries for the current user, sorted by `priority` ascending.

**Query Parameters**
| Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | Filter by type: `work`, `project`, `education`, `skill` |
| `includeHidden` | boolean | `false` | Include entries where `visible: false` |

**Response `200`**
```json
[
  {
    "_id": "665a...",
    "userId": "664f...",
    "type": "work",
    "title": "Software Engineer",
    "organization": "Acme Corp",
    "location": "Remote",
    "startDate": "Jun 2023",
    "endDate": "Present",
    "bullets": [
      { "text": "Built REST APIs with Node.js and Express" },
      { "text": "Reduced API latency by 40% via Redis caching" }
    ],
    "tags": ["Node.js", "Express", "Redis"],
    "priority": 1,
    "visible": true,
    "createdAt": "2025-01-15T10:05:00.000Z",
    "updatedAt": "2025-01-15T10:05:00.000Z"
  }
]
```

---

### `POST /api/experiences`

Create a new experience entry.

**Request Body**
```json
{
  "type": "work",
  "title": "Software Engineer",
  "organization": "Acme Corp",
  "location": "Remote",
  "startDate": "Jun 2023",
  "endDate": "Present",
  "bullets": [
    { "text": "Built REST APIs with Node.js and Express" }
  ],
  "tags": ["Node.js", "Express"],
  "priority": 1,
  "visible": true
}
```

**Validation**
- `type`: required, must be one of `work | project | education | skill`
- `title`: required, max 120 chars
- `bullets`: max 8 items, each `text` max 300 chars

**Response `201`** — the created document (same shape as GET item)

**Errors**
| Status | Code | Condition |
|---|---|---|
| `400` | `validation_error` | Missing required fields or constraint violation |
| `401` | `unauthorized` | Missing or invalid JWT |

---

### `GET /api/experiences/:id`

Fetch a single experience entry by ID.

**Response `200`** — single experience object

**Errors**
| Status | Code | Condition |
|---|---|---|
| `404` | `not_found` | ID not found or belongs to another user |

---

### `PUT /api/experiences/:id`

Update an existing experience entry. Send only the fields to change (partial update supported).

**Request Body** — any subset of the fields from `POST /api/experiences`

**Response `200`** — updated document

**Errors**
| Status | Code | Condition |
|---|---|---|
| `400` | `validation_error` | Constraint violation |
| `404` | `not_found` | ID not found or belongs to another user |

---

### `DELETE /api/experiences/:id`

Permanently delete an experience entry.

**Response `200`**
```json
{ "message": "Experience deleted" }
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| `404` | `not_found` | ID not found or belongs to another user |

---

## Tailoring

### `POST /api/tailor`

Core endpoint. Runs the full Kimi AI pipeline and returns a compiled PDF (or LaTeX preview).

**Request Body**
```json
{
  "jobTitle": "Senior Backend Engineer",
  "company": "Stripe",
  "jobDescriptionRaw": "We are looking for a Senior Backend Engineer...",
  "mode": "pdf"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `jobTitle` | string | No | Role title (used in resume header if provided) |
| `company` | string | No | Company name (used in resume header) |
| `jobDescriptionRaw` | string | Yes | Full text of the job description |
| `mode` | `"pdf"` \| `"preview"` | No | `"pdf"` streams binary PDF (default); `"preview"` returns JSON with LaTeX |

**Response — mode: `"pdf"` (default)**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume_stripe_senior_backend_engineer.pdf"

<binary PDF stream>
```

The response also includes a custom header:
```
X-Session-Id: <tailoringSession ObjectId>
```

**Response `200` — mode: `"preview"`**
```json
{
  "sessionId": "667b...",
  "latex": "\\documentclass[letterpaper,11pt]{article}\n...",
  "selectedExperienceIds": ["665a...", "665b..."],
  "extractedKeywords": {
    "hardSkills": ["Node.js", "PostgreSQL", "Kubernetes"],
    "softSkills": ["communication", "ownership"],
    "roleKeywords": ["distributed systems", "API design"],
    "seniorityLevel": "senior"
  }
}
```

**Errors**
| Status | Code | Condition |
|---|---|---|
| `400` | `validation_error` | Missing `jobDescriptionRaw` |
| `400` | `no_experiences` | User has no visible experience entries |
| `422` | `latex_compile_error` | PDF compilation failed; includes `log` field with trimmed pdflatex output |
| `502` | `kimi_api_error` | Kimi API returned an error or unparseable response |

**Notes:**
- The endpoint fetches all `MasterExperience` docs where `visible: true` for the authenticated user before calling Kimi.
- A `TailoringSession` document is always saved, even if PDF compilation fails (to preserve the generated LaTeX for debugging).
- `jobDescriptionRaw` is truncated to 20,000 characters server-side before processing.

---

### `GET /api/tailor/:sessionId/pdf`

Re-download the PDF for a past tailoring session. Recompiles the stored `generatedLatex` on demand if `pdfStoragePath` is null.

**Response** — same as `POST /api/tailor` with `mode: "pdf"`

**Errors**
| Status | Code | Condition |
|---|---|---|
| `404` | `not_found` | Session not found or belongs to another user |
| `422` | `latex_compile_error` | Recompilation failed |

---

### `GET /api/sessions`

List all past tailoring sessions for the current user, newest first.

**Query Parameters**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | `20` | Max results to return |
| `offset` | number | `0` | Pagination offset |

**Response `200`**
```json
{
  "total": 42,
  "sessions": [
    {
      "_id": "667b...",
      "jobTitle": "Senior Backend Engineer",
      "company": "Stripe",
      "extractedKeywords": {
        "hardSkills": ["Node.js", "PostgreSQL"],
        "softSkills": ["ownership"],
        "roleKeywords": ["distributed systems"],
        "seniorityLevel": "senior"
      },
      "selectedExperienceIds": ["665a...", "665b..."],
      "createdAt": "2025-06-10T14:30:00.000Z"
    }
  ]
}
```

Note: `generatedLatex` is **not** included in the list response for bandwidth reasons. Use `GET /api/tailor/:sessionId/pdf` to retrieve the PDF.

---

## Error Response Shape

All error responses follow this shape:

```json
{
  "error": "<error_code>",
  "message": "<human readable description>",
  "details": { }   // optional, field-level validation errors
}
```

Example validation error:
```json
{
  "error": "validation_error",
  "message": "Request body is invalid",
  "details": {
    "type": "must be one of: work, project, education, skill",
    "bullets": "maximum 8 bullets per entry"
  }
}
```
