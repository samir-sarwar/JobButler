import SectionHeader from '../ui/SectionHeader';
import ProjectCard from './ProjectCard';

export default function KeyProjectsSection({ projects, onEdit, onDelete }) {
  return (
    <section className="mt-10">
      <SectionHeader title="Key Projects" icon="code" count={projects.length} />
      <div className="grid grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
