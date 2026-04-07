export default function ExperienceCard({ experience, onEdit, onDelete }) {
  const { title, organization, startDate, endDate, bullets, tags } = experience;

  return (
    <div className="border-l-3 border-primary pl-5 py-4 mb-4 bg-surface-container-lowest">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-body text-sm font-semibold text-on-surface m-0">{title}</h4>
          <p className="font-display text-[0.65rem] uppercase tracking-widest text-on-surface-variant mt-1">
            {organization && `${organization} | `}
            {startDate} {endDate ? `\u2014 ${endDate}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(experience._id)}
            className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
          </button>
          <button
            onClick={() => onDelete?.(experience._id)}
            className="p-1 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {bullets.length > 0 && (
        <ul className="list-none p-0 m-0 mt-3 space-y-1.5">
          {bullets.slice(0, 3).map((bullet, i) => (
            <li key={i} className="font-body text-xs text-on-surface leading-relaxed">
              <span className="text-on-surface-variant mr-2">&mdash;</span>
              {bullet.text}
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 font-display text-[0.55rem] font-semibold uppercase tracking-widest bg-surface-container-high text-on-surface"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
