type EarMotifProps = {
  className?: string;
  tone?: "ink" | "sky" | "butter" | "stage";
};

const TONES = {
  ink: "var(--ink)",
  sky: "var(--sky-deep)",
  butter: "var(--butter)",
  stage: "var(--stage-line)",
} as const;

// The identity motif: three circles, plain geometry, no character art.
// Used as bullets, corner marks, and the step marker (see DESIGN.md).
export function EarMotif({ className, tone = "ink" }: EarMotifProps) {
  return (
    <svg
      viewBox="0 0 100 86"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="55" r="30" fill={TONES[tone]} />
      <circle cx="27" cy="24" r="20" fill={TONES[tone]} />
      <circle cx="73" cy="24" r="20" fill={TONES[tone]} />
    </svg>
  );
}
