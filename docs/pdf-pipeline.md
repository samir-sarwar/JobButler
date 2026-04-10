# PDF Compilation Pipeline

`server/services/pdfService.js` receives a LaTeX string and returns a compiled PDF buffer. Two backends are supported, selected via the `PDF_BACKEND` environment variable.

---

## Backend Options

| Backend | `PDF_BACKEND` value | Best for |
|---|---|---|
| `node-latex` | `node-latex` (default) | Local development, simple deployment |
| Dockerized TeX Live | `docker` | Production, full package support |

---

## Option A: `node-latex` (Default)

`node-latex` is an npm wrapper around a locally-installed `pdflatex` binary. It accepts a LaTeX string and returns a readable stream of the compiled PDF.

### Prerequisites

Install a TeX distribution locally:
```bash
# macOS
brew install --cask mactex    # full TeX Live, ~4GB, recommended
# OR
brew install basictex         # minimal, may lack packages

# Ubuntu/Debian
apt-get install texlive-full  # recommended
# OR
apt-get install texlive texlive-latex-extra

# Verify
pdflatex --version
```

### Installation

```bash
npm install node-latex
```

### Implementation

```js
// server/services/pdfService.js
import latex from 'node-latex';
import { Readable } from 'stream';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

const streamPipeline = promisify(pipeline);

/**
 * Compile a LaTeX string to a PDF buffer using node-latex.
 * @param {string} latexString  — complete .tex document
 * @returns {Promise<Buffer>}
 */
export async function compile(latexString) {
  const tmpDir = process.env.PDF_TMP_DIR || path.join(os.tmpdir(), 'jobbutler');
  const sessionId = randomUUID();
  const texPath = path.join(tmpDir, `${sessionId}.tex`);

  // Ensure temp directory exists
  await fs.promises.mkdir(tmpDir, { recursive: true });

  // Write .tex file (node-latex can also accept a string directly, but
  // writing to file first aids debugging and avoids encoding edge cases)
  await fs.promises.writeFile(texPath, latexString, 'utf8');

  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(texPath);
    const chunks = [];

    const pdfStream = latex(input, {
      cmd: 'pdflatex',
      inputs: tmpDir,   // tells pdflatex where to look for \input files
      passes: 1,        // Jake's Resume needs only 1 pass (no ToC, no bibliography)
      errorLogs: path.join(tmpDir, `${sessionId}.log`),
    });

    pdfStream.on('data', (chunk) => chunks.push(chunk));
    pdfStream.on('finish', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      // Cleanup temp files (fire-and-forget, don't block response)
      fs.promises.rm(texPath, { force: true }).catch(() => {});
      fs.promises.rm(path.join(tmpDir, `${sessionId}.log`), { force: true }).catch(() => {});
      resolve(pdfBuffer);
    });
    pdfStream.on('error', async (err) => {
      // Read log for diagnostic info
      let log = '';
      try {
        log = await fs.promises.readFile(
          path.join(tmpDir, `${sessionId}.log`), 'utf8'
        );
      } catch {}
      // Cleanup
      fs.promises.rm(texPath, { force: true }).catch(() => {});
      const compilationError = new Error('LaTeX compilation failed');
      compilationError.code = 'latex_compile_error';
      compilationError.log = extractErrorLines(log);
      reject(compilationError);
    });
  });
}

/**
 * Extract the relevant error lines from a pdflatex log.
 * Returns at most 20 lines surrounding the first "!" error marker.
 */
function extractErrorLines(log) {
  const lines = log.split('\n');
  const errorIndex = lines.findIndex(l => l.startsWith('!'));
  if (errorIndex === -1) return log.slice(-500); // last 500 chars as fallback
  return lines.slice(Math.max(0, errorIndex - 2), errorIndex + 18).join('\n');
}
```

### Known Limitations of `node-latex`

- Requires `pdflatex` installed on the host machine. Not available in all PaaS environments (Heroku, Vercel, etc.).
- Jake's Resume uses only standard TeX Live packages — all are included in `texlive-full`. Minimal installations (`basictex`, `texlive`) may lack `titlesec`, `marvosym`, or `enumitem`. Install missing packages with `tlmgr install <package>`.
- `node-latex` buffers the entire PDF in memory. For large resumes this is fine (typical output: 50–150KB).

---

## Option B: Dockerized TeX Live (Production)

For production deployments where installing TeX on the host is not feasible, run a TeX Live compilation server as a Docker sidecar.

### Architecture

```
Express API ──── HTTP POST ────▶ TeX Live sidecar
              (LaTeX string)         │
                                     │ pdflatex
                                     ▼
              ◀──── binary PDF ───── /compile endpoint
```

The sidecar is a lightweight Express server inside a `texlive/texlive` Docker image that accepts a LaTeX string and returns the compiled PDF.

### Sidecar `Dockerfile`

```dockerfile
# docker/texlive-sidecar/Dockerfile
FROM texlive/texlive:latest

WORKDIR /app

RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server.js ./

EXPOSE 3002

CMD ["node", "server.js"]
```

### Sidecar `server.js`

```js
// docker/texlive-sidecar/server.js
import express from 'express';
import { execFile } from 'child_process';
import { writeFile, readFile, rm, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';

const app = express();
app.use(express.json({ limit: '2mb' }));

const TMP = path.join(os.tmpdir(), 'latex-sidecar');

app.post('/compile', async (req, res) => {
  const { latex } = req.body;
  if (!latex) return res.status(400).json({ error: 'latex field required' });

  const id = randomUUID();
  const texFile = path.join(TMP, `${id}.tex`);
  const pdfFile = path.join(TMP, `${id}.pdf`);

  try {
    await mkdir(TMP, { recursive: true });
    await writeFile(texFile, latex, 'utf8');

    await new Promise((resolve, reject) => {
      execFile('pdflatex', [
        '-interaction=nonstopmode',
        '-output-directory', TMP,
        texFile,
      ], (err, stdout, stderr) => {
        if (err) {
          const compilationError = new Error('pdflatex failed');
          compilationError.log = stdout + stderr;
          return reject(compilationError);
        }
        resolve();
      });
    });

    const pdfBuffer = await readFile(pdfFile);
    res.set('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(422).json({
      error: 'latex_compile_error',
      log: err.log?.split('\n')
               .filter(l => l.startsWith('!') || l.includes('Error'))
               .slice(0, 20)
               .join('\n') || 'Unknown error',
    });
  } finally {
    // Cleanup — fire and forget
    rm(texFile, { force: true }).catch(() => {});
    rm(pdfFile, { force: true }).catch(() => {});
    rm(path.join(TMP, `${id}.aux`), { force: true }).catch(() => {});
    rm(path.join(TMP, `${id}.log`), { force: true }).catch(() => {});
  }
});

app.listen(3002, () => console.log('TeX Live sidecar listening on :3002'));
```

### `pdfService.js` Docker Branch

```js
// In server/services/pdfService.js — docker backend
async function compileWithDocker(latexString) {
  const url = process.env.DOCKER_LATEX_URL || 'http://localhost:3002/compile';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latex: latexString }),
  });

  if (!response.ok) {
    const body = await response.json();
    const err = new Error('LaTeX compilation failed');
    err.code = 'latex_compile_error';
    err.log = body.log || '';
    throw err;
  }

  return Buffer.from(await response.arrayBuffer());
}
```

### `docker-compose.yml` Integration

```yaml
# docker-compose.yml (project root)
version: '3.9'
services:
  api:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - PDF_BACKEND=docker
      - DOCKER_LATEX_URL=http://latex-sidecar:3002/compile
      - MONGODB_URI=mongodb://mongo:27017/jobbutler
      - JWT_SECRET=${JWT_SECRET}
      - KIMI_API_KEY=${KIMI_API_KEY}
    depends_on:
      - mongo
      - latex-sidecar

  latex-sidecar:
    build: ./docker/texlive-sidecar
    ports:
      - "3002:3002"
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo_data:
```

---

## `pdfService.js` Public API

```js
/**
 * Compile a LaTeX string to a PDF buffer.
 * Selects backend based on PDF_BACKEND env var.
 *
 * @param {string} latexString
 * @returns {Promise<Buffer>}
 * @throws {Error} with .code = 'latex_compile_error' and .log on failure
 */
export async function compile(latexString) {
  if (process.env.PDF_BACKEND === 'docker') {
    return compileWithDocker(latexString);
  }
  return compileWithNodeLatex(latexString);
}
```

---

## Optional PDF Storage

If `PDF_STORAGE_PATH` is set, `pdfService` saves the buffer to disk after compilation and returns the file path. The `TailorController` stores this path in `TailoringSession.pdfStoragePath`.

```js
// In pdfService.js — called after successful compile()
export async function savePdf(pdfBuffer, sessionId) {
  const storageDir = process.env.PDF_STORAGE_PATH;
  if (!storageDir) return null;  // storage disabled

  const filePath = path.join(storageDir, `${sessionId}.pdf`);
  await fs.promises.mkdir(storageDir, { recursive: true });
  await fs.promises.writeFile(filePath, pdfBuffer);
  return filePath;
}
```

For S3 storage, replace the `writeFile` call with an `@aws-sdk/client-s3` `PutObjectCommand`.

---

## Error Handling in the Controller

```js
// In server/controllers/tailor.js
try {
  const pdfBuffer = await pdfService.compile(latexString);
  // ...
} catch (err) {
  if (err.code === 'latex_compile_error') {
    return res.status(422).json({
      error: 'latex_compile_error',
      message: 'PDF compilation failed. The generated LaTeX may contain invalid content.',
      log: err.log,  // trimmed pdflatex log for debugging
    });
  }
  throw err;  // re-throw unexpected errors to global handler
}
```

---

## Streaming the PDF Response

Once the PDF buffer is ready, stream it directly to the client:

```js
// In server/controllers/tailor.js — PDF mode
const safeName = [company, jobTitle]
  .filter(Boolean)
  .join('_')
  .replace(/[^a-zA-Z0-9_-]/g, '_')
  .toLowerCase();
const filename = safeName ? `resume_${safeName}.pdf` : 'resume.pdf';

res.set({
  'Content-Type': 'application/pdf',
  'Content-Disposition': `attachment; filename="${filename}"`,
  'Content-Length': pdfBuffer.length,
  'X-Session-Id': session._id.toString(),
});
res.send(pdfBuffer);
```
