export default function StatusBar({ jobTitle }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-surface-container mb-6">
      <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant">
        Optimized for {jobTitle}
      </span>
      <span className="font-display text-[0.6rem] font-bold uppercase tracking-widest text-tertiary">
        AI-Optimized
      </span>
    </div>
  );
}
