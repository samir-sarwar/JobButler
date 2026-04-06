const variants = {
  primary: 'bg-primary text-on-primary hover:outline hover:outline-2 hover:outline-outline',
  secondary: 'bg-transparent text-primary border border-primary hover:bg-surface-container',
  tertiary: 'bg-tertiary text-on-tertiary hover:outline hover:outline-2 hover:outline-tertiary-container',
};

export default function Button({
  variant = 'primary',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 px-5 py-2.5
        font-display text-xs font-semibold uppercase tracking-widest
        transition-all duration-100 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-base">{loading ? 'hourglass_empty' : icon}</span>
      )}
    </button>
  );
}
