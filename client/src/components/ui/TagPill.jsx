const variants = {
  dark: 'bg-primary text-on-primary',
  light: 'bg-surface-container-high text-on-surface',
  tertiary: 'bg-tertiary text-on-tertiary',
  outline: 'bg-transparent text-on-surface border border-outline-variant',
};

export default function TagPill({ label, variant = 'dark', className = '' }) {
  return (
    <span
      className={`
        inline-block px-2.5 py-1
        font-display text-[0.6rem] font-semibold uppercase tracking-widest
        ${variants[variant] || variants.dark}
        ${className}
      `}
    >
      {label}
    </span>
  );
}
