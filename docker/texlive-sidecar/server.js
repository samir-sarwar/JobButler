import express from 'express';
import { execFile } from 'child_process';
import { writeFile, readFile, rm, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import os from 'os';

const app = express();
app.use(express.json({ limit: '2mb' }));

const TMP = path.join(os.tmpdir(), 'latex-sidecar');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
    // Cleanup
    rm(texFile, { force: true }).catch(() => {});
    rm(pdfFile, { force: true }).catch(() => {});
    rm(path.join(TMP, `${id}.aux`), { force: true }).catch(() => {});
    rm(path.join(TMP, `${id}.log`), { force: true }).catch(() => {});
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`TeX Live sidecar listening on :${PORT}`));
