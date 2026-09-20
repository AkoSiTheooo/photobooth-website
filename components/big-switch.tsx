"use client";

import { cn } from "cn";

type BigSwitchProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

// A full-row switch. The whole row is the target, so a child aiming at the words
// still hits it, and the row clears the 44px tap target minimum (R-03). A
// button-based switch cannot be named by a <label for>, and the stock switch is
// only 32x18.
export function BigSwitch({
  label,
  checked,
  onCheckedChange,
  disabled,
}: BigSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-field px-1 text-left text-base text-stage-text disabled:opacity-50"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-butter bg-butter" : "border-stage-line bg-stage",
        )}
      >
        <span
          className={cn(
            "absolute left-1 top-1/2 size-5 -translate-y-1/2 rounded-full transition-transform",
            checked ? "translate-x-5 bg-ink" : "bg-stage-text",
          )}
        />
      </span>
    </button>
  );
}
