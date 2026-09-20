"use client";

import { useState } from "react";
import { PhotoThumb } from "@/components/photo-thumb";
import { cn } from "cn";

type ReorderListProps = {
  blobs: Blob[];
  onSwap: (a: number, b: number) => void;
};

// Tap one photo, tap another, they trade places. No dragging: it is easier with
// small fingers and it works with a keyboard, which drag and drop does not.
export function ReorderList({ blobs, onSwap }: ReorderListProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  function pick(index: number) {
    if (selected === null) {
      setSelected(index);
      setStatus(`Photo ${index + 1} selected. Pick another photo to swap places.`);
      return;
    }
    if (selected === index) {
      setSelected(null);
      setStatus(`Photo ${index + 1} is staying where it is.`);
      return;
    }

    onSwap(selected, index);
    setStatus(`Photo ${selected + 1} and photo ${index + 1} swapped places.`);
    setSelected(null);
  }

  return (
    <div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {blobs.map((blob, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => pick(index)}
              aria-pressed={selected === index}
              className={cn(
                "relative block w-full overflow-hidden rounded-thumb border-2",
                selected === index
                  ? "border-butter"
                  : "border-transparent hover:border-line",
              )}
            >
              <PhotoThumb
                blob={blob}
                label={`Photo ${index + 1}${selected === index ? ", selected" : ""}`}
              />
              <span className="absolute bottom-1 left-1 rounded-chip bg-ink px-1.5 py-0.5 font-display text-xs font-semibold text-paper">
                {index + 1}
              </span>
              {selected === index ? (
                <span className="absolute inset-x-1 bottom-1 rounded-chip bg-butter px-1.5 py-0.5 text-center font-display text-xs font-semibold text-ink">
                  Selected
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-base text-ink-soft" aria-live="polite">
        {status || "Tap a photo, then tap another one to swap them."}
      </p>
    </div>
  );
}
