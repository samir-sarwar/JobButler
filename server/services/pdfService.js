import latex from 'node-latex';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

/**
 * PDF compilation error
 */
export class LatexCompileError extends Error {
  constructor(message, log) {
    super(message);
    this.name = 'LatexCompileError';
    this.code = 'latex_compile_error';
    this.log = log;
    this.status = 422;
  }
}

/**
 * Extract relevant error lines from pdflatex log
 */
function extractErrorLines(log) {
  if (!log) return 'No log available';
  
  const lines = log.split('\n');
  const errorIndex = lines.findIndex(l => l.startsWith('!'));
  
  if (errorIndex === -1) {
    // Return last 500 chars as fallback
    return log.slice(-500);
  }
  
  return lines.slice(Math.max(0, errorIndex - 2), errorIndex + 18).join('\n');
}

/**
 * Compile LaTeX using node-latex (local pdflatex)
 */
async function compileWithNodeLatex(latexString) {
  const tmpDir = process.env.PDF_TMP_DIR || path.join(os.tmpdir(), 'jobbutler');
  const sessionId = randomUUID();
  const texPath = path.join(tmpDir, `${sessionId}.tex`);
  const logPath = path.join(tmpDir, `${sessionId}.log`);

  // Ensure temp directory exists
  await fs.promises.mkdir(tmpDir, { recursive: true });

  // Write .tex file
  await fs.promises.writeFile(texPath, latexString, 'utf8');

  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(texPath);
    const chunks = [];

    const pdfStream = latex(input, {
      cmd: process.env.PDFLATEX_CMD || 'pdflatex',
      inputs: tmpDir,
      passes: 1,
      errorLogs: logPath,
    });

    pdfStream.on('data', (chunk) => chunks.push(chunk));
    
    pdfStream.on('finish', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Cleanup temp files (fire-and-forget)
      fs.promises.rm(texPath, { force: true }).catch(() => {});
      fs.promises.rm(logPath, { force: true }).catch(() => {});
      fs.promises.rm(path.join(tmpDir, `${sessionId}.aux`), { force: true }).catch(() => {});

      if (pdfBuffer.length === 0) {
        reject(new LatexCompileError('LaTeX compilation produced empty output', ''));
        return;
      }

      resolve(pdfBuffer);
    });

    pdfStream.on('error', async (err) => {
      let log = '';
      try {
        log = await fs.promises.readFile(logPath, 'utf8');
      } catch (readErr) {
        console.error('Could not read LaTeX log file:', readErr.message);
      }
      
      // Log the full error for debugging
      const errorLines = extractErrorLines(log);
      console.error('LaTeX compilation error:', errorLines);
      console.error('Original node-latex error:', err.message);
      
      // Also save the .tex file for debugging (don't delete on error)
      console.error('LaTeX source file saved at:', texPath);
      
      // Only cleanup log file
      fs.promises.rm(logPath, { force: true }).catch(() => {});
      
      reject(new LatexCompileError('LaTeX compilation failed', errorLines));
    });
  });
}

/**
 * Compile LaTeX using Docker TeX Live sidecar
 */
async function compileWithDocker(latexString) {
  const url = process.env.DOCKER_LATEX_URL || 'http://localhost:3002/compile';

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latex: latexString }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new LatexCompileError('LaTeX compilation failed', body.log || 'Unknown error');
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Compile a LaTeX string to a PDF buffer.
 * Selects backend based on PDF_BACKEND env var.
 *
 * @param {string} latexString - Complete .tex document
 * @returns {Promise<Buffer>} - PDF buffer
 * @throws {LatexCompileError} - On compilation failure
 */
export async function compile(latexString) {
  if (process.env.PDF_BACKEND === 'docker') {
    return compileWithDocker(latexString);
  }
  return compileWithNodeLatex(latexString);
}

/**
 * Save PDF to persistent storage
 * @param {Buffer} pdfBuffer - PDF data
 * @param {string} sessionId - Session ID for filename
 * @returns {Promise<string|null>} - File path or null if storage disabled
 */
export async function savePdf(pdfBuffer, sessionId) {
  const storageDir = process.env.PDF_STORAGE_PATH;
  if (!storageDir) return null;

  const filePath = path.join(storageDir, `${sessionId}.pdf`);
  await fs.promises.mkdir(storageDir, { recursive: true });
  await fs.promises.writeFile(filePath, pdfBuffer);
  
  return filePath;
}

/**
 * Read PDF from storage
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<Buffer|null>} - PDF buffer or null if not found
 */
export async function readPdf(pdfPath) {
  if (!pdfPath) return null;
  
  try {
    return await fs.promises.readFile(pdfPath);
  } catch {
    return null;
  }
}

export default {
  compile,
  savePdf,
  readPdf,
  LatexCompileError,
};
