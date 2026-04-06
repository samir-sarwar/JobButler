const styles = {
  verified: {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
    label: 'Verified Manuscript',
  },
  draft: {
    dot: 'bg-outline',
    text: 'text-on-surface-variant',
    label: 'Draft Status',
  },
  active: {
    dot: 'bg-tertiary',
    text: 'text-tertiary',
    label: 'AI Engine Active',
  },
};

export default function StatusBadge({ status = 'draft', label }) {
  const style = styles[status] || styles.draft;
  const displayLabel = label || style.label;

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 inline-block ${style.dot}`} />
      <span className={`font-display text-[0.6rem] font-semibold uppercase tracking-widest ${style.text}`}>
        {displayLabel}
      </span>
    </span>
  );
}
