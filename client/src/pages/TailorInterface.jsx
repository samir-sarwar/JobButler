import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tailorResume } from '../api';
import JobDescriptionInput from '../components/tailor/JobDescriptionInput';
import AIHighlightsPanel from '../components/tailor/AIHighlightsPanel';
import InstructionsPanel from '../components/tailor/InstructionsPanel';
import ProgressStepper from '../components/tailor/ProgressStepper';

export default function TailorInterface() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    jobDescriptionRaw: '',
  });
  const [stage, setStage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [error, setError] = useState(null);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = async () => {
    if (!formData.jobDescriptionRaw.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStage(1);
    setHighlights([]);

    try {
      // Call the real API with mode 'json' to get both PDF and LaTeX
      const response = await tailorResume({
        ...formData,
        mode: 'json', // Get JSON response with latex included
      });

      // Stage 2 & 3: Response received — selection and generation complete
      setStage(3);

      // Build highlights from extracted keywords
      if (response.extractedKeywords) {
        const keywords = response.extractedKeywords;
        const highlightItems = [];
        
        if (keywords.hardSkills?.length > 0) {
          highlightItems.push({
            id: 'hl_skills',
            ref: '#SKILLS',
            label: 'Technical Skills',
            text: `Detected: ${keywords.hardSkills.slice(0, 5).join(', ')}`,
            tags: keywords.hardSkills.slice(0, 3).map(s => s.toUpperCase()),
          });
        }
        
        if (keywords.roleKeywords?.length > 0) {
          highlightItems.push({
            id: 'hl_role',
            ref: '#ROLE',
            label: 'Role Focus',
            text: `Key areas: ${keywords.roleKeywords.slice(0, 4).join(', ')}`,
            tags: [keywords.seniorityLevel?.toUpperCase() || 'PROFESSIONAL'],
          });
        }
        
        setHighlights(highlightItems);
      }

      // Navigate to editor with the session ID
      if (response.sessionId) {
        navigate(`/editor/${response.sessionId}`);
      } else {
        setError('Resume generated but no session ID returned');
      }
    } catch (err) {
      console.error('Tailor error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate resume. Check server logs.');
      setStage(0);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8">
      {/* Reference badge */}
      <span className="inline-block px-3 py-1 bg-surface-container font-display text-[0.55rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
        Manuscript_04
      </span>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight text-on-surface m-0">
          Job Input &amp; Analysis.
        </h1>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2 max-w-2xl">
          Paste the target job description. Our engine will cross-reference your Vault
          for optimal matching fragments.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm">
          {error}
        </div>
      )}

      {/* Progress Stepper */}
      <ProgressStepper stage={stage} isComplete={false} />

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-8">
        {/* Left: Job Input */}
        <div className="col-span-3">
          <JobDescriptionInput
            value={formData}
            onChange={handleChange}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right: AI Highlights */}
        <div className="col-span-2">
          <AIHighlightsPanel highlights={highlights} isLoading={isGenerating} />
        </div>
      </div>

      {/* Instructions */}
      <InstructionsPanel />
    </div>
  );
}
