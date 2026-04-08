import { useCallback, useRef } from 'react';

const SECTION_MARKERS = [
  { label: 'Education', pattern: '\\section{Education}' },
  { label: 'Experience', pattern: '\\section{Experience}' },
  { label: 'Projects', pattern: '\\section{Projects}' },
  { label: 'Skills', pattern: '\\section{Technical Skills}' },
];

export default function EditorPanel({ latex, onChange }) {
  const textareaRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const jumpToSection = useCallback((pattern) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const idx = ta.value.indexOf(pattern);
    if (idx === -1) return;
    ta.focus();
    ta.setSelectionRange(idx, idx + pattern.length);
    // Scroll to selection
    const linesBefore = ta.value.substring(0, idx).split('\n').length;
    const lineHeight = 18; // approximate px per line
    ta.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
  }, []);

  // Count which sections exist
  const availableSections = SECTION_MARKERS.filter(
    (s) => latex && latex.includes(s.pattern)
  );

  return (
    <div className="pr-2 flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-xs text-on-surface-variant leading-relaxed">
          Edit the LaTeX source directly. Changes update the preview in real-time.
        </p>
      </div>

      {/* Section navigation */}
      {availableSections.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="font-display text-[0.55rem] uppercase tracking-widest text-on-surface-variant">
            Jump to:
          </span>
          {availableSections.map((s) => (
            <button
              key={s.label}
              onClick={() => jumpToSection(s.pattern)}
              className="px-2 py-0.5 bg-surface-container text-on-surface-variant hover:text-on-surface font-display text-[0.55rem] uppercase tracking-widest cursor-pointer border-none transition-colors duration-100"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* LaTeX editor textarea */}
      <textarea
        ref={textareaRef}
        value={latex || ''}
        onChange={handleChange}
        spellCheck={false}
        className="flex-1 w-full bg-surface-container-lowest border border-outline-variant p-4 font-mono text-xs text-on-surface leading-relaxed resize-none focus:outline-none focus:border-primary overflow-y-auto custom-scrollbar"
        style={{ minHeight: '400px', tabSize: 2 }}
        placeholder="No LaTeX content available..."
      />
    </div>
  );
}
