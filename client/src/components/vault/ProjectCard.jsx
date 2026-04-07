import TagPill from '../ui/TagPill';

export default function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <div className="p-5 bg-surface-container-low mb-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-display text-xs font-bold uppercase tracking-wider text-on-surface m-0">
          {project.title}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit?.(project._id)}
            className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
          </button>
          <button
            onClick={() => onDelete?.(project._id)}
            className="p-1 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {project.bullets.length > 0 && (
        <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-3">
          {project.bullets.map((b) => b.text).join(' ')}
        </p>
      )}

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <TagPill key={tag} label={tag} variant="light" />
          ))}
        </div>
      )}
    </div>
  );
}
