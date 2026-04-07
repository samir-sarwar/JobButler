export default function Footer({ sectionLabel = 'SYSTEM' }) {
  return (
    <footer className="flex items-center justify-between px-8 py-4 border-t border-outline-variant bg-surface">
      <p className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
        JobButler Digital Archive // {sectionLabel}
      </p>
      <div className="flex gap-6">
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors duration-100">
          System Logs
        </span>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors duration-100">
          Privacy Policy
        </span>
        <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors duration-100">
          Documentation
        </span>
      </div>
    </footer>
  );
}
