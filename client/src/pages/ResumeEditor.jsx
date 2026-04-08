import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchSession, downloadPdf } from '../api';
import Button from '../components/ui/Button';
import StatusBar from '../components/editor/StatusBar';
import EditorPanel from '../components/editor/EditorPanel';
import LatexPreview from '../components/editor/LatexPreview';

export default function ResumeEditor() {
  const { sessionId } = useParams();
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [latex, setLatex] = useState('');
  const [extractedKeywords, setExtractedKeywords] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLatex, setShowLatex] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchSession(sessionId);
        setSession(data);
        setLatex(data.generatedLatex || '');
        setExtractedKeywords(data.extractedKeywords || {});
      } catch (err) {
        console.error('Failed to load session:', err);
        setError(err.response?.data?.message || 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleDownload = async () => {
    try {
      showToast('Downloading PDF...', 'info');
      const response = await downloadPdf(sessionId);

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${session?.company || 'tailored'}_${session?.jobTitle || 'resume'}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('PDF downloaded!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleCopyLatex = useCallback(() => {
    if (latex) {
      navigator.clipboard.writeText(latex);
      showToast('LaTeX copied to clipboard!', 'success');
    }
  }, [latex, showToast]);

  const handleLatexChange = useCallback((newLatex) => {
    setLatex(newLatex);
  }, []);

  // Build resumeData object for LatexPreview
  const resumeData = { latex };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
          Loading session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-error-container text-on-error-container">
          <h2 className="font-display text-lg font-semibold mb-2">Error</h2>
          <p className="font-body text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-surface m-0">
            Resume Editor
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2 max-w-xl">
            {session?.jobTitle && session?.company
              ? `Tailored for ${session.jobTitle} at ${session.company}`
              : 'Modify, finalize, and export your AI-optimized technical manuscript.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon="content_copy"
            onClick={handleCopyLatex}
          >
            Copy LaTeX
          </Button>
          <Button variant="tertiary" icon="download" onClick={handleDownload}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        jobTitle={`${session?.company || ''} - ${session?.jobTitle || ''}`}
      />

      {/* Toggle between LaTeX view and preview */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => setShowLatex(false)}
          className={`px-4 py-2 font-display text-xs uppercase tracking-widest cursor-pointer border-none ${
            !showLatex
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setShowLatex(true)}
          className={`px-4 py-2 font-display text-xs uppercase tracking-widest cursor-pointer border-none ${
            showLatex
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
          }`}
        >
          LaTeX Code
        </button>
      </div>

      {/* Content area */}
      {showLatex ? (
        /* LaTeX Code View */
        <div className="bg-surface-container p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
              Generated LaTeX
            </h3>
            <button
              onClick={handleCopyLatex}
              className="font-body text-xs text-primary hover:underline cursor-pointer bg-transparent border-none"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="bg-surface-container-lowest p-4 overflow-x-auto text-xs font-mono text-on-surface max-h-[70vh] overflow-y-auto">
            {latex || 'No LaTeX generated'}
          </pre>
        </div>
      ) : (
        /* Preview View — Editor on left, rendered preview on right */
        <div className="grid grid-cols-2 gap-6">
          {/* Left: LaTeX Editor */}
          <div>
            <EditorPanel latex={latex} onChange={handleLatexChange} />
          </div>

          {/* Right: Live Preview */}
          <div>
            <LatexPreview resumeData={resumeData} />
          </div>
        </div>
      )}

      {/* Keywords extracted */}
      {Object.keys(extractedKeywords).length > 0 && (
        <div className="mt-6 p-4 bg-surface-container">
          <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Extracted Keywords
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {extractedKeywords.hardSkills?.length > 0 && (
              <div>
                <p className="font-body text-xs text-on-surface-variant mb-1">Hard Skills</p>
                <div className="flex flex-wrap gap-1">
                  {extractedKeywords.hardSkills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {extractedKeywords.softSkills?.length > 0 && (
              <div>
                <p className="font-body text-xs text-on-surface-variant mb-1">Soft Skills</p>
                <div className="flex flex-wrap gap-1">
                  {extractedKeywords.softSkills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {extractedKeywords.roleKeywords?.length > 0 && (
              <div>
                <p className="font-body text-xs text-on-surface-variant mb-1">Role Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {extractedKeywords.roleKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-tertiary/10 text-tertiary text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
