import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';

export default function SelectedSnapshot({ session }) {
  if (!session) return null;

  const keywords = session.extractedKeywords;

  return (
    <div className="mt-8 border-t-2 border-primary pt-6">
      <h3 className="font-display text-xs font-bold uppercase tracking-widest text-on-surface mb-6">
        Selected Snapshot
      </h3>

      <div className="grid grid-cols-3 gap-8">
        {/* Details */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-on-surface m-0">
              {session.jobTitle}
            </h4>
            <StatusBadge status={session.status} />
          </div>

          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
              Summary:
            </p>
            <p className="font-body text-xs text-on-surface leading-relaxed">
              Highly skilled {session.jobTitle} with expertise in {keywords.hardSkills?.slice(0, 3).join(', ')}.
              Focused on {keywords.roleKeywords?.slice(0, 2).join(' and ')}.
            </p>
          </div>

          <div>
            <p className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
              Skills:
            </p>
            <p className="font-body text-xs text-on-surface">
              {keywords.hardSkills?.join(', ')}
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <span className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
              {session.version}
            </span>
            <button className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface hover:text-tertiary cursor-pointer bg-transparent border-none flex items-center gap-1">
              Full Preview
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
        </div>

        {/* Re-optimization CTA */}
        <div className="bg-surface-container p-5">
          <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-3 block">auto_awesome</span>
          <h4 className="font-display text-xs font-bold uppercase tracking-widest text-on-surface mb-2">
            Need an update?
          </h4>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-4">
            Re-process any existing manuscript for a new job with one click.
          </p>
          <Button variant="secondary" icon="refresh">
            Re-Optimize Selected
          </Button>
        </div>
      </div>
    </div>
  );
}
