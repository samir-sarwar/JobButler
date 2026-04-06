export default function SectionHeader({ title, count, icon, children }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-6 border-b border-outline-variant">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="material-symbols-outlined text-lg text-on-surface-variant">{icon}</span>
        )}
        <h3 className="font-display text-xs font-semibold uppercase tracking-widest text-on-surface m-0">
          {title}
        </h3>
        {count != null && (
          <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
            [{String(count).padStart(2, '0')} Entries]
          </span>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
