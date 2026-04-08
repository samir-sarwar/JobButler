export default function EditorSection({ number, title, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-outline-variant">
        <span className="font-display text-lg font-bold text-outline-variant">{number}</span>
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-on-surface m-0">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
