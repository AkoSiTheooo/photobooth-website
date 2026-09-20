"use client";

import Link from "next/link";
import { EarMotif } from "@/components/ear-motif";
import { StripCanvas } from "@/components/strip-canvas";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useFrames } from "@/hooks/use-frames";

const STEPS = [
  "Stand in front of the camera.",
  "Wait for the countdown, then smile.",
  "Do it four times. That fills your strip.",
];

export default function TemplatePage() {
  const { frames, loading, error, retry } = useFrames();
  const frame = frames[0];

  return (
    <main className="flex flex-1 justify-center px-5 py-10">
      <div className="w-full max-w-5xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
        >
          Back to start
        </Link>

        <div className="mt-6 grid items-start gap-10 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[220px]">
            {loading ? (
              <Skeleton className="aspect-[1/3] w-full rounded-thumb" />
            ) : frame ? (
              <StripCanvas
                frame={frame}
                label="Your photo strip: four empty photo windows stacked in a tall frame"
                className="rounded-thumb border border-line"
              />
            ) : null}
          </div>

          <div>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              You are going to take four photos.
            </h1>
            <p className="mt-4 max-w-[46ch] text-lg text-ink-soft">
              The camera counts you down before every photo, so you have time to get
              ready.
            </p>

            <ol className="mt-8 space-y-4">
              {STEPS.map((step) => (
                <li key={step} className="flex items-start gap-3 text-lg text-ink">
                  <EarMotif className="mt-1 size-6 shrink-0" tone="sky" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {error ? (
              <Alert className="mt-8 rounded-field">
                <AlertTitle>The template could not load</AlertTitle>
                <AlertDescription>
                  {error}{" "}
                  <button
                    type="button"
                    onClick={retry}
                    className="font-semibold underline underline-offset-4"
                  >
                    Try again
                  </button>
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full font-display text-lg font-semibold shadow-none sm:px-10"
              >
                <Link href="/booth">Start the camera</Link>
              </Button>
              <p className="text-base text-ink-soft">More photo templates are coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
