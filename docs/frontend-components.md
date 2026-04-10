# Frontend Components

The React frontend is a Vite + React 18 SPA located in `client/`. It uses **React Router v6** for routing, **React Query** for server state, **React Context + useReducer** for auth, and **Axios** for HTTP.

---

## Routes

| Path | Page Component | Auth Required |
|---|---|---|
| `/login` | `<AuthPage>` | No |
| `/register` | `<AuthPage mode="register">` | No |
| `/profile` | `<MasterProfileDashboard>` | Yes |
| `/tailor` | `<TailorInterface>` | Yes |
| `/history` | `<SessionHistory>` | Yes |
| `/` | Redirect → `/tailor` if logged in, else `/login` | — |

`<ProtectedRoute>` wraps auth-required routes. If no token is present in context, it redirects to `/login`.

---

## Application Structure

```
App.jsx
├── AuthProvider (context)
│   └── QueryClientProvider (react-query)
│       └── Router
│           ├── /login           → <AuthPage>
│           ├── /register        → <AuthPage mode="register">
│           └── <ProtectedRoute>
│               ├── /profile     → <MasterProfileDashboard>
│               ├── /tailor      → <TailorInterface>
│               └── /history     → <SessionHistory>
```

---

## Auth Context

**Location:** `client/src/context/AuthContext.jsx`

Stores the JWT token and decoded user object. Persists token to `localStorage`.

```js
// State shape
{
  token: string | null,
  user: { _id: string, email: string } | null,
  isLoading: boolean,   // true during initial localStorage hydration
}

// Actions
{ type: 'LOGIN', payload: { token, user } }
{ type: 'LOGOUT' }

// Exposed via useAuth() hook:
{
  token,
  user,
  isAuthenticated,     // boolean: token != null
  login(token, user),  // dispatch LOGIN + store to localStorage
  logout(),            // dispatch LOGOUT + clear localStorage + redirect /login
}
```

---

## Axios Instance

**Location:** `client/src/api/index.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jb_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

All API call functions (e.g. `fetchExperiences`, `createExperience`, `tailorResume`) are exported from this file as thin wrappers around `api.get/post/put/delete`.

---

## Pages

### `<AuthPage>`

**Location:** `client/src/pages/AuthPage.jsx`

Two-tab form (Login / Register). On submit, calls `POST /api/auth/login` or `/register`, stores the JWT via `useAuth().login()`, and navigates to `/tailor`.

**Component tree:**
```
<AuthPage>
  └── <Tabs>  (login | register)
      ├── <LoginForm>
      │   ├── <input type="email">
      │   ├── <input type="password">
      │   └── <button> Submit
      └── <RegisterForm>
          ├── <input type="email">
          ├── <input type="password">
          ├── <input type="password"> (confirm)
          └── <button> Submit
```

**State:** `useState` for form fields and error message. No React Query (auth endpoints are not cached).

---

### `<MasterProfileDashboard>`

**Location:** `client/src/pages/MasterProfileDashboard.jsx`

The primary experience management page. Lists all the user's `MasterExperience` entries grouped by type, and provides controls to add, edit, delete, reorder, and toggle visibility.

**Component tree:**
```
<MasterProfileDashboard>
  ├── <ProfileHeader>         — user email, "Add Experience" button
  ├── <TypeTabs>              — tabs: All | Work | Projects | Education | Skills
  └── <ExperienceList>
      ├── <ExperienceCard>    (×N — one per entry)
      │   ├── Title + Organization + Date range
      │   ├── Tag pills
      │   ├── Bullet preview (first 2, truncated)
      │   ├── Priority drag handle
      │   └── Actions: Edit | Delete | Toggle visibility
      └── <AddExperienceButton>  → opens <ExperienceForm> modal
```

**Data fetching:** React Query `useQuery(['experiences'], fetchExperiences)`. Invalidates on create/update/delete.

**`useExperiences` custom hook** (`client/src/hooks/useExperiences.js`):
```js
// Wraps React Query mutations for create/update/delete
const { experiences, isLoading, createExperience, updateExperience, deleteExperience } = useExperiences();
```

---

### `<ExperienceCard>`

**Location:** `client/src/components/ExperienceCard.jsx`

**Props:**
```ts
{
  experience: MasterExperience,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onToggleVisibility: (id: string, visible: boolean) => void,
}
```

Displays:
- Bold title + organization (if present)
- Date range string: `startDate – endDate`
- Tags rendered as small pill spans
- First 2 bullet `text` values (truncated at 80 chars with `…`)
- `visible: false` entries rendered with 50% opacity and a "Hidden" badge

---

### `<ExperienceForm>`

**Location:** `client/src/components/ExperienceForm.jsx`

Modal form for creating or editing a `MasterExperience` entry. Pre-populates fields when `experienceId` prop is provided (edit mode).

**Props:**
```ts
{
  experienceId?: string,   // if provided, fetches and pre-populates the entry (edit mode)
  onClose: () => void,
  onSaved: () => void,     // called after successful create or update
}
```

**Fields rendered:**
| Field | Input type | Notes |
|---|---|---|
| `type` | `<select>` | work / project / education / skill |
| `title` | `<input text>` | required |
| `organization` | `<input text>` | hidden when type = skill |
| `location` | `<input text>` | hidden when type = skill |
| `startDate` | `<input text>` | placeholder: "Jan 2022" |
| `endDate` | `<input text>` | placeholder: "Present" |
| `bullets` | `<BulletListEditor>` | see below |
| `tags` | `<TagInput>` | see below |
| `priority` | `<input number>` | |
| `visible` | `<input checkbox>` | |

**`<BulletListEditor>`** (inline sub-component):
- Renders a dynamic list of textarea inputs, one per bullet.
- "Add bullet" button appends a new empty textarea.
- "×" button on each row removes that bullet.
- Drag handle for reordering (optional — implement with `@dnd-kit/core`).

**`<TagInput>`** (inline sub-component):
- Free-form text input. Pressing `Enter` or `,` commits the current value as a tag pill.
- Each pill has an "×" to remove.
- Stored as `string[]` in form state.

**Form state:** `useState` with a single `formData` object. Validate on submit (client-side: required fields only; server handles full validation).

---

### `<TailorInterface>`

**Location:** `client/src/pages/TailorInterface.jsx`

The core user flow: paste a JD, click generate, download the PDF.

**Component tree:**
```
<TailorInterface>
  ├── <JobDescriptionInput>     — textarea for JD + optional job title/company fields
  ├── <GenerateButton>          — disabled until JD is non-empty; shows spinner during generation
  ├── <ProgressStepper>         — visible only during generation
  └── <ResumePreview>           — visible after successful generation
```

**Flow:**
1. User fills `<JobDescriptionInput>`.
2. Clicks Generate → `POST /api/tailor` with `mode: "preview"`.
3. `<ProgressStepper>` shows the 3-stage pipeline progress (polled or SSE — see notes).
4. On success: `<ResumePreview>` appears with LaTeX source and download button.
5. Download button calls `GET /api/tailor/:sessionId/pdf` and triggers browser download.

**State:** `useState` for `{ jobTitle, company, jobDescriptionRaw }` and the generation result. No React Query (this is a write operation with streaming concerns).

---

### `<JobDescriptionInput>`

**Location:** `client/src/components/JobDescriptionInput.jsx`

**Props:**
```ts
{
  value: { jobTitle: string, company: string, jobDescriptionRaw: string },
  onChange: (field: string, value: string) => void,
}
```

Renders:
- `<input text>` for Job Title (optional)
- `<input text>` for Company (optional)
- `<textarea rows={10}>` for Job Description (required)
- "Paste from clipboard" icon button → calls `navigator.clipboard.readText()` and sets `jobDescriptionRaw`
- Character counter: `{jobDescriptionRaw.length} / 20,000`

---

### `<ProgressStepper>`

**Location:** `client/src/components/ProgressStepper.jsx`

Displays the three Kimi pipeline stages while generation is in progress.

**Props:**
```ts
{
  stage: 0 | 1 | 2 | 3,  // 0 = not started, 1 = extracting, 2 = selecting, 3 = rewriting
  isComplete: boolean,
  isError: boolean,
}
```

Renders 3 steps in a horizontal stepper:
1. Extracting keywords *(spinner while active, checkmark when done)*
2. Selecting experiences *(spinner while active, checkmark when done)*
3. Rewriting bullets *(spinner while active, checkmark when done)*

**Note on progress:** The `POST /api/tailor` endpoint currently runs all 3 stages synchronously and returns when complete. To show real progress, either:
- **(Simple)** Show a fake animated stepper that advances on a timer (e.g. 3s per stage). This is acceptable for v1.
- **(Accurate)** Implement Server-Sent Events (SSE): the server emits `stage:1`, `stage:2`, `stage:3` events as each Kimi call completes, then sends the final result.

For v1, implement the simple animated approach and leave SSE as a future enhancement.

---

### `<ResumePreview>`

**Location:** `client/src/components/ResumePreview.jsx`

**Props:**
```ts
{
  sessionId: string,
  latex: string,
  extractedKeywords: { hardSkills: string[], softSkills: string[], roleKeywords: string[], seniorityLevel: string },
}
```

Renders:
- A `<pre>` block with syntax-highlighted LaTeX source (use `react-syntax-highlighter` with the `latex` language).
- A keywords summary: small pills for detected hard skills and role keywords.
- **"Download PDF" button**: calls `GET /api/tailor/:sessionId/pdf`, receives binary, and creates a temporary `<a>` tag with `URL.createObjectURL()` to trigger download.
- "Copy LaTeX" button: copies raw LaTeX to clipboard via `navigator.clipboard.writeText()`.

**Download implementation:**
```js
async function handleDownload() {
  setIsDownloading(true);
  try {
    const response = await api.get(`/tailor/${sessionId}/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    setIsDownloading(false);
  }
}
```

---

### `<SessionHistory>`

**Location:** `client/src/pages/SessionHistory.jsx`

Lists all past tailoring sessions for the user.

**Component tree:**
```
<SessionHistory>
  ├── <PageHeader>  "Resume History"
  └── <SessionList>
      └── <SessionCard> (×N)
          ├── Job title + company
          ├── Date generated (formatted relative time: "2 days ago")
          ├── Extracted keyword pills (hard skills, truncated to 5)
          └── "Download PDF" button → GET /api/tailor/:sessionId/pdf
```

**Data fetching:** React Query `useQuery(['sessions'], fetchSessions)` with `{ limit: 20, offset: 0 }`. Supports simple "Load more" pagination (not infinite scroll for v1).

---

## State Management Summary

| Concern | Approach |
|---|---|
| Auth (token, user) | React Context + `useReducer` + `localStorage` |
| Experience list | React Query (`useQuery` + `useMutation`) |
| Session history | React Query (`useQuery`) |
| Form state | Local `useState` per form component |
| Tailor generation | Local `useState` in `<TailorInterface>` |
| Global error toasts | React Context (`ToastContext`) with `useToast()` hook |

---

## Environment Variables (Client)

Client env vars must be prefixed with `VITE_` to be exposed by Vite.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |

Set in `client/.env` for local development. In production, set in your hosting environment or `client/.env.production`.

---

## Key npm Dependencies (Client)

| Package | Purpose |
|---|---|
| `react-router-dom` v6 | Client-side routing |
| `@tanstack/react-query` v5 | Server state management |
| `axios` | HTTP client |
| `react-syntax-highlighter` | LaTeX code highlighting in `<ResumePreview>` |
| `@dnd-kit/core` (optional) | Drag-to-reorder bullets in `<ExperienceForm>` |
