import { useState, useEffect, useRef } from 'react';
import { previewPdf } from '../../api';

export default function PdfPreview({ latex }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState(null);
  const prevUrlRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!latex) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setCompiling(true);
      setError(null);

      try {
        const response = await previewPdf(latex, controller.signal);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setObjectUrl(url);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        let errorInfo = { message: 'Compile failed', log: '' };
        if (err.response?.data) {
          try {
            const text = new TextDecoder().decode(err.response.data);
            errorInfo = JSON.parse(text);
          } catch {
            // ignore parse failure
          }
        }
        setError(errorInfo);
      } finally {
        setCompiling(false);
      }
    }, 1500);
  }, [latex]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {objectUrl && (
        <iframe
          src={objectUrl}
          title="PDF Preview"
          style={{ width: '100%', height: 'calc(100vh - 280px)', border: 0, background: '#fff' }}
        />
      )}

      {!objectUrl && !compiling && !error && (
        <div className="bg-surface-container-lowest border border-outline-variant p-8 flex items-center justify-center" style={{ height: 'calc(100vh - 280px)' }}>
          <p className="font-body text-sm text-on-surface-variant">Preparing preview...</p>
        </div>
      )}

      {compiling && (
        <div
          style={{
            position: objectUrl ? 'absolute' : 'static',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.85)',
            zIndex: 10,
          }}
        >
          <span className="font-body text-xs text-on-surface-variant">Compiling...</span>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-error-container text-on-error-container">
          <p className="font-display text-xs font-semibold uppercase tracking-widest mb-1">
            {error.message || 'LaTeX compile error'}
          </p>
          {error.log && (
            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
              {error.log}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
