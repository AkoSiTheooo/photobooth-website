"use client";

import { PhotoThumb } from "@/components/photo-thumb";
import { cn } from "cn";
import { SHOT_ASPECT } from "@/lib/framing";

type ShotRailProps = {
  shots: Blob[];
  count: number;
  className?: string;
};

// Numbered slots: filled as the photos arrive, empty until then, so a child can
// see how far along the set is.
export function ShotRail({ shots, count, className }: ShotRailProps) {
  return (
    <ol className={cn("grid grid-cols-4 gap-2", className)}>
      {Array.from({ length: count }, (_, index) => {
        const shot = shots[index];
        return (
          <li
            key={index}
            className={cn(
              "relative overflow-hidden rounded-thumb border",
              shot ? "border-transparent" : "border-dashed border-stage-line",
            )}
            style={{ aspectRatio: SHOT_ASPECT }}
          >
            {shot ? <PhotoThumb blob={shot} label={`Photo ${index + 1}`} /> : null}
            <span className="absolute bottom-1 left-1 rounded-chip bg-stage px-1.5 py-0.5 font-display text-xs font-semibold text-stage-text">
              {index + 1}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
