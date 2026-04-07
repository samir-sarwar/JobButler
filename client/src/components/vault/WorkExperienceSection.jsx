import SectionHeader from '../ui/SectionHeader';
import ExperienceCard from './ExperienceCard';

export default function WorkExperienceSection({ experiences, onEdit, onDelete }) {
  return (
    <section>
      <SectionHeader title="Work Experience" icon="work" count={experiences.length} />
      {experiences.map((exp) => (
        <ExperienceCard
          key={exp._id}
          experience={exp}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
