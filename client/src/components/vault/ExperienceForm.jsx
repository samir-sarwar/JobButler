import { useState } from 'react';
import Button from '../ui/Button';

const experienceTypes = ['work', 'project', 'education', 'skill'];

function BulletListEditor({ bullets, onChange }) {
  const addBullet = () => onChange([...bullets, { text: '' }]);
  const removeBullet = (index) => onChange(bullets.filter((_, i) => i !== index));
  const updateBullet = (index, text) =>
    onChange(bullets.map((b, i) => (i === index ? { text } : b)));

  return (
    <div>
      <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
        Bullet Points
      </label>
      {bullets.map((bullet, i) => (
        <div key={i} className="flex items-start gap-2 mb-2">
          <span className="text-on-surface-variant mt-2 text-xs">&mdash;</span>
          <textarea
            value={bullet.text}
            onChange={(e) => updateBullet(i, e.target.value)}
            rows={2}
            maxLength={300}
            className="editor-input flex-1 resize-none"
            placeholder="Describe an achievement..."
          />
          <button
            onClick={() => removeBullet(i)}
            className="mt-1 p-1 text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
      <button
        onClick={addBullet}
        className="font-display text-[0.6rem] uppercase tracking-widest text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border-none mt-1"
      >
        + Add bullet
      </button>
    </div>
  );
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = (value) => {
    const tag = value.trim().toUpperCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
  };

  return (
    <div>
      <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
        Tags
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-container-high text-on-surface font-display text-[0.55rem] font-semibold uppercase tracking-widest"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-on-surface-variant hover:text-error cursor-pointer bg-transparent border-none p-0 leading-none"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(input)}
        className="editor-input"
        placeholder="Type and press Enter..."
      />
    </div>
  );
}

export default function ExperienceForm({ experience, onClose, onSave }) {
  const isEditing = !!experience;

  const [formData, setFormData] = useState(() => {
    if (experience) {
      return {
        type: experience.type,
        title: experience.title || '',
        organization: experience.organization || '',
        location: experience.location || '',
        startDate: experience.startDate || '',
        endDate: experience.endDate || '',
        bullets: experience.bullets?.length > 0 ? experience.bullets : [{ text: '' }],
        tags: experience.tags || [],
        priority: experience.priority || 1,
        visible: experience.visible ?? true,
      };
    }
    return {
      type: 'work',
      title: '',
      organization: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: [{ text: '' }],
      tags: [],
      priority: 1,
      visible: true,
    };
  });

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const showOrgFields = formData.type !== 'skill';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(formData);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-primary/40">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar bg-surface-container-lowest p-8 border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest m-0">
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer bg-transparent border-none"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div>
            <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => update('type', e.target.value)}
              className="editor-input cursor-pointer"
            >
              {experienceTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              className="editor-input"
              placeholder="e.g. Senior Systems Architect"
              required
            />
          </div>

          {/* Organization & Location */}
          {showOrgFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => update('organization', e.target.value)}
                  className="editor-input"
                  placeholder="e.g. Neural Dynamics Corp."
                />
              </div>
              <div>
                <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => update('location', e.target.value)}
                  className="editor-input"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                Start Date
              </label>
              <input
                type="text"
                value={formData.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="editor-input"
                placeholder="Jan 2022"
              />
            </div>
            <div>
              <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                End Date
              </label>
              <input
                type="text"
                value={formData.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className="editor-input"
                placeholder="Present"
              />
            </div>
          </div>

          {/* Bullets */}
          <BulletListEditor
            bullets={formData.bullets}
            onChange={(bullets) => update('bullets', bullets)}
          />

          {/* Tags */}
          <TagInput
            tags={formData.tags}
            onChange={(tags) => update('tags', tags)}
          />

          {/* Priority & Visible */}
          <div className="flex items-center gap-6">
            <div>
              <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => update('priority', parseInt(e.target.value) || 1)}
                className="editor-input w-20"
                min={1}
              />
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => update('visible', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant">
                Visible
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-outline-variant">
            <Button type="submit" variant="primary" icon="check">
              {isEditing ? 'Update' : 'Create'}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
