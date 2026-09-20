type BoothProgressProps = {
  shotLabel: string | null;
  message: string | null;
};

// One polite live region for the booth. The countdown numeral is decorative on
// purpose: announcing every second would talk over itself, so screen readers
// hear the shot number and what is happening instead.
export function BoothProgress({ shotLabel, message }: BoothProgressProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="mt-4 min-h-12 text-stage-text"
    >
      {shotLabel ? (
        <p className="font-display text-lg font-semibold">{shotLabel}</p>
      ) : null}
      {message ? <p className="text-base text-stage-muted">{message}</p> : null}
    </div>
  );
}
