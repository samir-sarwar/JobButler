# LaTeX Template — Jake's Resume

JobButler generates PDF resumes using the **Jake's Resume** LaTeX template. All output LaTeX **must** conform exactly to this template — no custom commands, no additional packages, no structural deviations.

---

## Complete Template (Verbatim)

This is the full base template. The `latexBuilder.js` service populates the marked injection points.

```latex
%-------------------------
% Jake's Resume — https://www.overleaf.com/latex/templates/jakes-resume
% License: MIT
%-------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

%-------------------------
% Custom commands
%-------------------------

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
% DOCUMENT START
%-------------------------------------------

\begin{document}

%----------HEADING----------
\begin{tabular*}{\textwidth}{l@{\extracolsep{\fill}}r}
  \textbf{\href{mailto:{{USER_EMAIL}}}{\Large {{USER_NAME}}}} & Email: \href{mailto:{{USER_EMAIL}}}{{{USER_EMAIL}}}\\
  \href{{{USER_LINKEDIN}}}{ {{USER_LINKEDIN_DISPLAY}} } & Mobile: {{USER_PHONE}} \\
\end{tabular*}

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    {{EDUCATION_ENTRIES}}
  \resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
    {{WORK_ENTRIES}}
  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
      {{PROJECT_ENTRIES}}
    \resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
      {{SKILL_ENTRIES}}
    }}
 \end{itemize}

%-------------------------------------------
\end{document}
```

---

## LaTeX Macro Reference

### `\resumeSubheading{title}{date-range}{subtitle}{location}`

Used for: **Work experience** and **Education** entries.

| Argument | Maps to `MasterExperience` field |
|---|---|
| `#1` title | `title` (bold) |
| `#2` date-range | `startDate` – `endDate` |
| `#3` subtitle | `organization` (italic, small) |
| `#4` location | `location` (italic, small) |

**Example output:**
```latex
\resumeSubheading
  {Software Engineer}{Jun 2023 -- Present}
  {Acme Corp}{Remote}
  \resumeItemListStart
    \resumeItem{Built REST APIs with Node.js and Express}
    \resumeItem{Reduced API latency by 40\% via Redis caching}
  \resumeItemListEnd
```

---

### `\resumeProjectHeading{bold-title}{date-range}`

Used for: **Project** entries. The first argument takes a formatted bold title with optional tech stack pipe separator.

| Argument | Maps to |
|---|---|
| `#1` | `\textbf{title} $|$ \emph{tags joined by comma}` |
| `#2` | `startDate` – `endDate` |

**Example output:**
```latex
\resumeProjectHeading
  {\textbf{JobButler} $|$ \emph{React, Node.js, MongoDB, Kimi K2.5}}{Jan 2025 -- Present}
  \resumeItemListStart
    \resumeItem{Developed AI-driven resume tailoring system using Kimi K2.5}
    \resumeItem{Built LaTeX PDF compilation pipeline with TeX Live}
  \resumeItemListEnd
```

---

### `\resumeItem{bullet text}`

Used for: All bullet points under any entry type.

- One `\resumeItem` per bullet.
- Wrap in `\resumeItemListStart` / `\resumeItemListEnd`.

---

### Skill Section Format

Skill entries do not use `\resumeSubheading`. Each `MasterExperience` of `type: 'skill'` generates one line per bullet:

```latex
\textbf{Languages}{: Python, TypeScript, Go} \\
\textbf{Frameworks}{: React, Express, FastAPI} \\
\textbf{Tools}{: Docker, Git, MongoDB, PostgreSQL} \\
```

The `latexBuilder` splits each skill bullet at the first `:` to extract the category label and value. If no `:` is found, the entire bullet is rendered as a plain line without bold label.

---

## Field Injection Map

| Template Placeholder | Source |
|---|---|
| `{{USER_NAME}}` | `User.name` (add `name` field to schema, or derive from email prefix) |
| `{{USER_EMAIL}}` | `User.email` |
| `{{USER_LINKEDIN}}` | `User.linkedinUrl` |
| `{{USER_LINKEDIN_DISPLAY}}` | `User.linkedinUrl` stripped of `https://` |
| `{{USER_PHONE}}` | `User.phone` |
| `{{EDUCATION_ENTRIES}}` | All education `MasterExperience` entries, rendered as `\resumeSubheading` |
| `{{WORK_ENTRIES}}` | Selected work entries, rendered as `\resumeSubheading` + bullets |
| `{{PROJECT_ENTRIES}}` | Selected project entries, rendered as `\resumeProjectHeading` + bullets |
| `{{SKILL_ENTRIES}}` | All skill entries, rendered as bold-label lines |

**Note:** The User model needs three extra fields for the header: `name`, `phone`, `linkedinUrl`. Add these to `User.js` (all optional strings, max 120 chars).

---

## LaTeX Escaping Rules

All user-generated strings **must** be passed through `latexEscape()` before insertion into the template. Failure to escape will cause `pdflatex` compilation errors.

### Characters That Must Be Escaped

| Raw character | LaTeX escape |
|---|---|
| `%` | `\%` |
| `&` | `\&` |
| `$` | `\$` |
| `#` | `\#` |
| `_` | `\_` |
| `{` | `\{` |
| `}` | `\}` |
| `~` | `\textasciitilde{}` |
| `^` | `\textasciicircum{}` |
| `\` | `\textbackslash{}` |

### `latexEscape` Utility Function Spec

**Location:** `server/utils/latexEscape.js`

**Signature:**
```js
/**
 * Escape a plain-text string for safe insertion into a LaTeX document.
 * @param {string} input  — raw user-generated string
 * @returns {string}  — LaTeX-safe string
 */
export function latexEscape(input) {}
```

**Contract:**
- Input: any string (may be empty, `null`, or `undefined`)
- Output: escaped string safe for use in LaTeX text mode
- `null` / `undefined` → return `''`
- Empty string → return `''`
- Must NOT double-escape (i.e. do not escape an already-escaped `\%`)
- Escaping must happen in a single pass — use a regex replace with a character class

**Reference implementation:**
```js
export function latexEscape(input) {
  if (input == null) return '';
  return String(input)
    .replace(/\\/g, '\\textbackslash{}')   // must be first
    .replace(/%/g,  '\\%')
    .replace(/&/g,  '\\&')
    .replace(/\$/g, '\\$')
    .replace(/#/g,  '\\#')
    .replace(/_/g,  '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g,  '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}
```

**Important:** The `\` replacement must always come **first** to avoid double-escaping the backslashes introduced by subsequent replacements.

---

## Section Ordering

The sections in the generated `.tex` must appear in this order to match Jake's Resume layout:

1. Heading (name + contact)
2. Education
3. Experience
4. Projects
5. Technical Skills

If any section has zero entries, the entire section (including `\section{...}` and list wrappers) must be **omitted** — do not emit an empty section.

---

## Bullet Constraints (Enforced by `latexBuilder`)

Before inserting any bullet into the template, `latexBuilder` must validate:

| Constraint | Value | Action on violation |
|---|---|---|
| Minimum bullets per work/project entry | 2 | Pad with original bullets until minimum reached |
| Maximum bullets per work/project entry | 4 | Truncate to first 4 |
| Maximum bullet character length | 120 chars (raw, pre-escape) | Truncate at last word before limit |
| Empty bullet | — | Skip (do not emit `\resumeItem{}`) |

---

## Complete Entry Generation Example

Given this `MasterExperience` document and rewritten bullets:

```json
{
  "_id": "665a1234",
  "type": "work",
  "title": "Software Engineer",
  "organization": "Acme Corp",
  "location": "Remote",
  "startDate": "Jun 2023",
  "endDate": "Present"
}
```

Rewritten bullets from Stage 3:
```json
[
  "Architected RESTful microservices in Node.js serving 2M+ daily requests",
  "Optimized PostgreSQL query performance, reducing p99 latency by 40%",
  "Designed distributed caching layer with Redis, improving throughput by 3x"
]
```

Generated LaTeX:
```latex
\resumeSubheading
  {Software Engineer}{Jun 2023 -- Present}
  {Acme Corp}{Remote}
  \resumeItemListStart
    \resumeItem{Architected RESTful microservices in Node.js serving 2M+ daily requests}
    \resumeItem{Optimized PostgreSQL query performance, reducing p99 latency by 40\%}
    \resumeItem{Designed distributed caching layer with Redis, improving throughput by 3x}
  \resumeItemListEnd
```

Note: `%` in "40%" is escaped to `\%`.
