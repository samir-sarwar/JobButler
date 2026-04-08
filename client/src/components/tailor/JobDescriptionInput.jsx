import Button from '../ui/Button';

export default function JobDescriptionInput({ value, onChange, onGenerate, isGenerating }) {
  const charCount = value.jobDescriptionRaw?.length || 0;

  return (
    <div>
      {/* Job Title & Company */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={value.jobTitle || ''}
            onChange={(e) => onChange('jobTitle', e.target.value)}
            maxLength={120}
            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant font-body text-sm text-on-surface outline-none focus:border-primary transition-colors duration-100"
            placeholder="e.g. Senior Software Engineer"
          />
        </div>
        <div>
          <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
            Company
          </label>
          <input
            type="text"
            value={value.company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            maxLength={120}
            className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant font-body text-sm text-on-surface outline-none focus:border-primary transition-colors duration-100"
            placeholder="e.g. Google"
          />
        </div>
      </div>

      {/* Job Description */}
      <label className="font-display text-[0.6rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-3">
        Paste Job Description
      </label>

      <textarea
        value={value.jobDescriptionRaw}
        onChange={(e) => onChange('jobDescriptionRaw', e.target.value)}
        rows={14}
        maxLength={5000}
        className="w-full p-4 bg-surface-container-lowest border border-outline-variant font-body text-sm text-on-surface leading-relaxed resize-none outline-none focus:border-primary transition-colors duration-100"
        placeholder="-- BEGIN EXTERNAL JOB POSTING --&#10;&#10;Insert text here..."
      />

      <div className="flex items-center justify-between mt-3">
        <span className="font-display text-[0.55rem] uppercase tracking-widest text-on-surface-variant">
          Char Count: {charCount} / 5,000
        </span>
      </div>

      <div className="mt-6">
        <Button
          variant="primary"
          icon="arrow_forward"
          iconPosition="right"
          onClick={onGenerate}
          loading={isGenerating}
          disabled={charCount === 0}
          className="w-full justify-center py-3.5"
        >
          Generate Resume
        </Button>
      </div>
    </div>
  );
}
