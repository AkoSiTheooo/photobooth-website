import { EarMotif } from "@/components/ear-motif";
import { cn } from "cn";

type WordmarkProps = {
  className?: string;
  tone?: "ink" | "stage";
};

// Placeholder wordmark: there is no designed logo yet, so the name is set in the
// display face and flagged here instead of inventing a mark (antislop R-23).
export function Wordmark({ className, tone = "ink" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display font-semibold tracking-tight",
        tone === "ink" ? "text-ink" : "text-stage-text",
        className,
      )}
    >
      <EarMotif className="size-6 shrink-0" tone={tone === "ink" ? "ink" : "butter"} />
      PhotoToy
    </span>
  );
}
