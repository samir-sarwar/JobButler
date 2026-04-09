import SessionRow from './SessionRow';

export default function SessionTable({ sessions, selectedId, onSelect, onDownload }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b-2 border-primary">
          <th className="text-left py-3 px-4 font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant">
            Job Title
          </th>
          <th className="text-left py-3 px-4 font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant">
            Date Generated
          </th>
          <th className="text-left py-3 px-4 font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <SessionRow
            key={session._id}
            session={session}
            isSelected={selectedId === session._id}
            onSelect={onSelect}
            onDownload={onDownload}
          />
        ))}
      </tbody>
    </table>
  );
}
