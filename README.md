# JobButler

> AI-powered resume tailoring — match your experience to any job description in seconds.

JobButler is a MERN-stack web application that uses the **Kimi K2.5 API** to intelligently select and rewrite your work experience, projects, and skills to match a target job description. The output is a professionally formatted PDF built on the **Jake's Resume** LaTeX template.

---

## How It Works

1. **Build your Master Profile** — add every job, project, skill, and education entry once. Tag each entry with keywords.
2. **Paste a job description** — drop any JD into the Tailor interface.
3. **One-click generation** — Kimi K2.5 extracts keywords, selects your most relevant experiences, and rewrites bullet points for the role.
4. **Download your PDF** — a pixel-perfect Jake's Resume PDF is compiled and streamed to your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Query, Axios, React Router v6 |
| Backend | Node.js 20, Express 5 |
| Database | MongoDB 7, Mongoose 8 |
| AI | Kimi K2.5 (Moonshot AI API) |
| PDF | `node-latex` (dev) / Dockerized TeX Live (prod) |
| Auth | JWT (jsonwebtoken), bcrypt |

---

## Repository Structure

```
jobbutler/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios instance + API call functions
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context + reducer
│   │   ├── pages/           # Route-level page components
│   │   └── main.jsx
│   └── package.json
├── server/                  # Express backend
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth JWT middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── services/            # Kimi API, LaTeX compiler, PDF service
│   ├── utils/               # LaTeX escaping, token counting
│   └── index.js
├── docs/                    # Agent context documentation (this folder)
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-reference.md
│   ├── kimi-integration.md
│   ├── latex-template.md
│   ├── pdf-pipeline.md
│   └── frontend-components.md
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB running locally (or Atlas URI)
- Kimi API key from [platform.moonshot.cn](https://platform.moonshot.cn)
- LaTeX: install `texlive-full` locally **or** Docker (for production pipeline)

### 1. Clone and install

```bash
git clone <repo-url>
cd jobbutler

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env with your values (see docs/architecture.md for all keys)
```

### 3. Run in development

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:3001`

### 4. Seed sample experience data

```bash
cd server && npm run seed
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System diagram, data flow, environment variables |
| [Database Schema](docs/database-schema.md) | MongoDB models, indexes, Mongoose snippets |
| [API Reference](docs/api-reference.md) | All REST endpoints, request/response shapes |
| [Kimi Integration](docs/kimi-integration.md) | AI pipeline, prompts, response schemas |
| [LaTeX Template](docs/latex-template.md) | Jake's Resume template, field mapping, escaping rules |
| [PDF Pipeline](docs/pdf-pipeline.md) | node-latex and Docker TeX Live compilation |
| [Frontend Components](docs/frontend-components.md) | Pages, component tree, state management |

---

## License

MIT
