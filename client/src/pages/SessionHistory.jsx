import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { useToast } from '../context/ToastContext';
import { downloadPdf } from '../api';
import Button from '../components/ui/Button';
import SessionTable from '../components/history/SessionTable';
import Pagination from '../components/history/Pagination';
import SelectedSnapshot from '../components/history/SelectedSnapshot';

export default function SessionHistory() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { sessions, total, isLoading } = useSessions({ limit, offset });
  const [selectedId, setSelectedId] = useState(null);

  const selectedSession = sessions.find((s) => s._id === selectedId);

  const handleDownload = async (sessionId) => {
    try {
      showToast('Downloading PDF...', 'info');
      const response = await downloadPdf(sessionId);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const session = sessions.find((s) => s._id === sessionId);
      const safeName = [session?.company, session?.jobTitle]
        .filter(Boolean)
        .join('_')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      link.download = safeName ? `resume_${safeName}.pdf` : 'resume.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('PDF downloaded!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download PDF. The resume may need to be regenerated.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
          Loading resumes...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface m-0">
            Vault
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2 max-w-xl">
            Archive of optimized technical manuscripts. Verified entries marked in tertiary green.
          </p>
        </div>
        <Button
          variant="tertiary"
          icon="add"
          onClick={() => navigate('/tailor')}
        >
          Create New Resume
        </Button>
      </div>

      {/* Session Table */}
      <SessionTable
        sessions={sessions}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDownload={handleDownload}
      />

      {/* Pagination */}
      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        onPageChange={setOffset}
      />

      {/* Selected Snapshot */}
      <SelectedSnapshot session={selectedSession} />
    </div>
  );
}
