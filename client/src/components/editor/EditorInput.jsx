export default function EditorInput({ value, onChange, placeholder, multiline = false, label }) {
  return (
    <div className="mb-3">
      {label && (
        <label className="font-display text-[0.55rem] font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="editor-input resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="editor-input"
        />
      )}
    </div>
  );
}
