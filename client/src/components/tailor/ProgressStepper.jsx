const stages = [
  { label: 'Extracting Keywords', icon: 'key' },
  { label: 'Selecting Experiences', icon: 'filter_alt' },
  { label: 'Rewriting Bullets', icon: 'edit_note' },
];

export default function ProgressStepper({ stage = 0, isComplete = false, isError = false }) {
  if (stage === 0 && !isComplete) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        {stages.map((s, i) => {
          const stepNum = i + 1;
          const isActive = stage === stepNum && !isComplete;
          const isDone = stage > stepNum || isComplete;

          return (
            <div key={s.label} className="flex-1 flex flex-col items-center">
              {/* Step indicator */}
              <div
                className={`w-8 h-8 flex items-center justify-center mb-2 transition-colors duration-100 ${
                  isDone
                    ? 'bg-tertiary text-on-tertiary'
                    : isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : isActive ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="font-display text-xs font-bold">{stepNum}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`font-display text-[0.55rem] uppercase tracking-widest text-center ${
                  isDone
                    ? 'text-tertiary'
                    : isActive
                    ? 'text-on-surface font-semibold'
                    : 'text-on-surface-variant'
                }`}
              >
                {s.label}
              </span>

            </div>
          );
        })}
      </div>

      {isError && (
        <p className="font-display text-[0.6rem] uppercase tracking-widest text-error text-center mt-3">
          Generation failed. Please try again.
        </p>
      )}
    </div>
  );
}
