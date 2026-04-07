import SectionHeader from '../ui/SectionHeader';
import TagPill from '../ui/TagPill';

export default function SkillsMatrix({ skills, onAdd }) {
  return (
    <section className="bg-surface-container p-6">
      <SectionHeader title="Skills Matrix" icon="settings_ethernet" />

      {skills.length === 0 && (
        <p className="font-body text-xs text-on-surface-variant mb-4">
          No skills added yet. Import from a resume or add manually.
        </p>
      )}

      {skills.map((skill) => (
        <div key={skill._id} className="mb-5">
          <p className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
            {skill.title}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skill.tags.map((tag) => (
              <TagPill key={tag} label={tag} variant="dark" />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onAdd}
        className="mt-4 w-full py-2.5 border border-outline-variant bg-transparent font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:border-primary cursor-pointer transition-colors duration-100"
      >
        + Add Competency
      </button>
    </section>
  );
}
