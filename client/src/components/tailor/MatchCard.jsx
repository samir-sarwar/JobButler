import TagPill from '../ui/TagPill';

export default function MatchCard({ match }) {
  return (
    <div className="border border-outline-variant p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-[0.6rem] font-bold uppercase tracking-widest text-tertiary">
          [Match Found]
        </span>
        <span className="font-display text-[0.55rem] uppercase tracking-widest text-on-surface-variant">
          Ref: {match.ref}
        </span>
      </div>

      <p className="font-body text-xs text-on-surface leading-relaxed mb-3 italic">
        {match.text}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {match.tags.map((tag) => (
          <TagPill key={tag} label={tag} variant="light" />
        ))}
      </div>
    </div>
  );
}
