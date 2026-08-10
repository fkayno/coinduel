interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: "ACCOUNT" },
  { step: 2, label: "WALLET" },
  { step: 3, label: "READY" },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {STEPS.map((s, i) => {
        const isActive = s.step === currentStep;
        const isComplete = s.step < currentStep;
        return (
          <div key={s.step} className="flex items-center gap-3">
            <span
              className={`text-xs font-bold tracking-[0.2em] transition-colors duration-300 ${
                isActive || isComplete ? "text-accent" : "text-muted/50"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`text-xs ${isComplete ? "text-accent" : "text-muted/30"}`}>
                &rarr;
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
