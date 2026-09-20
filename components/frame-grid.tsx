"use client";

import { type FrameDefinition } from "@/lib/frames";
import { cn } from "cn";

type FrameGridProps = {
  frames: FrameDefinition[];
  value: string;
  onChange: (key: string) => void;
};

export function FrameGrid({ frames, value, onChange }: FrameGridProps) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {frames.map((frame) => {
        const active = frame.key === value;
        return (
          <li key={frame.key}>
            <button
              type="button"
              onClick={() => onChange(frame.key)}
              aria-pressed={active}
              className={cn(
                "block w-full rounded-thumb border-2 p-1 text-left",
                active ? "border-butter" : "border-transparent hover:border-line",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- frame asset shown at thumbnail size */}
              <img
                src={frame.src}
                alt=""
                className="w-full rounded-[8px] border border-line/50"
              />
              <span
                className={cn(
                  "mt-2 block font-display text-sm font-semibold",
                  active ? "text-ink" : "text-ink-soft",
                )}
              >
                {frame.name}
              </span>
              {frame.placeholder ? (
                <span className="mt-0.5 block text-xs text-ink-soft">Sample frame</span>
              ) : null}
              {active ? <span className="sr-only">Selected</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
