"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-card border border-line/60 bg-card p-6">
      <h1 className="font-display text-2xl text-ink">The photo desk hit a problem</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        {error.message || "Something went wrong while loading this page."}
      </p>
      <Button onClick={reset} className="mt-5 h-11 rounded-full px-5 text-ink">
        Try again
      </Button>
    </div>
  );
}
