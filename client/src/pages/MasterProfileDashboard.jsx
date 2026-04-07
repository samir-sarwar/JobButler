import { useState } from 'react';
import { useExperiences } from '../hooks/useExperiences';
import Button from '../components/ui/Button';
import WorkExperienceSection from '../components/vault/WorkExperienceSection';
import SkillsMatrix from '../components/vault/SkillsMatrix';
import KeyProjectsSection from '../components/vault/KeyProjectsSection';
import ExperienceForm from '../components/vault/ExperienceForm';
import ResumeUploader from '../components/vault/ResumeUploader';

export default function MasterProfileDashboard() {
  const { experiences, isLoading, createExperience, updateExperience, deleteExperience, refetch } = useExperiences();
  const [showForm, setShowForm] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [showUploader, setShowUploader] = useState(false);

  const workExperiences = experiences.filter((e) => e.type === 'work');
  const projects = experiences.filter((e) => e.type === 'project');
  const skills = experiences.filter((e) => e.type === 'skill');

  const handleEdit = (id) => {
    const exp = experiences.find((e) => e._id === id);
    setEditingExp(exp);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteExperience(id);
  };

  const handleSave = (formData) => {
    if (editingExp) {
      updateExperience({ id: editingExp._id, data: formData });
    } else {
      createExperience(formData);
    }
    setShowForm(false);
    setEditingExp(null);
  };

  const handleImportComplete = () => {
    setShowUploader(false);
    // Refetch experiences to show newly imported ones
    refetch?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
          Loading vault...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface m-0">
            The Vault
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2 max-w-xl">
            A centralized repository of professional milestones, technical proficiencies,
            and project documentation. Managed with LaTeX-style structural integrity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon="upload_file"
            onClick={() => setShowUploader(true)}
          >
            Import Resume
          </Button>
          <Button
            variant="tertiary"
            icon="add"
            onClick={() => { setEditingExp(null); setShowForm(true); }}
          >
            Add New Entry
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left: Experience + Projects */}
        <div className="col-span-2">
          <WorkExperienceSection
            experiences={workExperiences}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <KeyProjectsSection
            projects={projects}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Right: Skills Matrix */}
        <div>
          <SkillsMatrix skills={skills} onAdd={() => { setEditingExp({ type: 'skill' }); setShowForm(true); }} />
        </div>
      </div>

      {/* Experience Form Modal */}
      {showForm && (
        <ExperienceForm
          experience={editingExp}
          onClose={() => { setShowForm(false); setEditingExp(null); }}
          onSave={handleSave}
        />
      )}

      {/* Resume Uploader Modal */}
      {showUploader && (
        <ResumeUploader
          onClose={() => setShowUploader(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
