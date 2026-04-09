import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ` [${d.toLocaleTimeString('en-US', { hour12: false })}]`;
}

export default function SessionRow({ session, isSelected, onSelect, onDownload }) {
  return (
    <tr
      onClick={() => onSelect?.(session._id)}
      className={`cursor-pointer border-b border-outline-variant transition-colors duration-100 ${
        isSelected ? 'bg-surface-container-low' : 'hover:bg-surface-container-low/50'
      }`}
    >
      <td className="py-4 px-4">
        <div>
          <p className="font-body text-sm font-semibold text-on-surface m-0">{session.jobTitle}</p>
          <div className="mt-1">
            <StatusBadge status={session.status} />
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="font-display text-[0.65rem] uppercase tracking-widest text-on-surface-variant m-0">
          {formatDate(session.createdAt)}
        </p>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={(e) => { e.stopPropagation(); onSelect?.(session._id); }}>
            View
          </Button>
          <Button variant="primary" icon="download" onClick={(e) => { e.stopPropagation(); onDownload?.(session._id); }}>
            Download
          </Button>
        </div>
      </td>
    </tr>
  );
}
