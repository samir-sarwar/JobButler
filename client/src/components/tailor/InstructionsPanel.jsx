const steps = [
  {
    number: '01',
    text: 'Ensure technical keywords are preserved in the text block. The AI engine cross-references your Vault for optimal matching fragments.',
  },
  {
    number: '02',
    text: 'Our AI prioritizes fragments based on "Impact Metrics" \u2014 quantifiable achievements and concrete deliverables rank highest.',
  },
  {
    number: '03',
    text: 'Output will be formatted as a LaTeX-compatible technical resume using Jake\'s Resume template with full ATS optimization.',
  },
];

export default function InstructionsPanel() {
  return (
    <div className="mt-8 pt-6 border-t border-outline-variant">
      <h3 className="font-display text-xs font-bold uppercase tracking-widest text-on-surface mb-5">
        Instructions
      </h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <span className="font-display text-lg font-bold text-outline-variant leading-none">
              {step.number}
            </span>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
