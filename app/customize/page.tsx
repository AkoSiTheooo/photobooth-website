"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBooth } from "@/components/booth-context";
import { FrameGrid } from "@/components/frame-grid";
import { ReorderList } from "@/components/reorder-list";
import { StripCanvas } from "@/components/strip-canvas";
import { Wordmark } from "@/components/wordmark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFrames } from "@/hooks/use-frames";
import { loadFrameImage } from "@/lib/frames";
import {
  composeStrip,
  downloadBlob,
  loadShotImage,
  pngWithPrintDpi,
  stripFilename,
  stripToPng,
} from "@/lib/render-strip";

export default function CustomizePage() {
  const { shots, reset } = useBooth();
  const { frames, loading: framesLoading, error: framesError, retry } = useFrames();

  const [order, setOrder] = useState([0, 1, 2, 3]);
  const [loaded, setLoaded] = useState<{
    source: Blob[];
    images: HTMLImageElement[];
  } | null>(null);
  const [failed, setFailed] = useState<{ source: Blob[]; message: string } | null>(
    null,
  );
  const [frameKey, setFrameKey] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  // Both values are keyed by the photo set, so a new set reads as loading while
  // the previous one is still in state and nothing resets synchronously.
  const images = loaded?.source === shots ? loaded.images : null;
  const imageError = failed?.source === shots ? failed.message : null;

  useEffect(() => {
    if (shots.length === 0) return;

    let cancelled = false;

    Promise.all(shots.map(loadShotImage))
      .then((next) => {
        if (!cancelled) setLoaded({ source: shots, images: next });
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setFailed({
            source: shots,
            message:
              cause instanceof Error
                ? cause.message
                : "The photos could not be opened.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shots]);

  const frame = frames.find((candidate) => candidate.key === frameKey) ?? frames[0];

  const orderedBlobs = useMemo(
    () => order.map((index) => shots[index]).filter((blob) => blob !== undefined),
    [order, shots],
  );

  const orderedImages = useMemo(
    () => (images ? order.map((index) => images[index] ?? null) : []),
    [images, order],
  );

  function swap(a: number, b: number) {
    setOrder((current) => {
      const next = [...current];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  async function exportStrip() {
    if (!frame || images === null) return;

    setExporting(true);
    setExportMessage("");

    try {
      const frameImage = await loadFrameImage(frame);
      const canvas = document.createElement("canvas");
      composeStrip(canvas, { frame, frameImage, shots: orderedImages });
      const printable = await pngWithPrintDpi(await stripToPng(canvas), 300);
      downloadBlob(printable, stripFilename());
      setExportMessage("Saved to your device. Print it at 2 by 6 inches.");
    } catch (cause) {
      setExportMessage(
        cause instanceof Error ? cause.message : "The strip could not be saved.",
      );
    } finally {
      setExporting(false);
    }
  }

  if (shots.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center">
          <Wordmark className="justify-center text-2xl" />
          <h1 className="mt-6 font-display text-3xl text-ink">
            There are no photos here yet.
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            This page puts your four photos into a frame, so it needs photos first.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 rounded-full font-display text-lg font-semibold text-ink shadow-none"
          >
            <Link href="/booth">Start the booth again</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 px-5 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between">
          <Wordmark className="text-lg" />
          <Link
            href="/booth"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
          >
            Back to the camera
          </Link>
        </header>

        <h1 className="mt-6 font-display text-4xl leading-tight text-ink">
          Make it yours.
        </h1>
        <p className="mt-3 max-w-[52ch] text-lg text-ink-soft">
          Swap your photos around, pick a frame, and watch your strip change as you
          go.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[260px] lg:sticky lg:top-8 lg:self-start">
            {framesLoading || images === null ? (
              <Skeleton className="aspect-[1/3] w-full rounded-thumb" />
            ) : frame ? (
              <StripCanvas
                frame={frame}
                shots={orderedImages}
                label="Your photo strip preview, updating as you change photos and frames"
                className="rounded-thumb border border-line"
              />
            ) : null}

            <Button
              onClick={() => void exportStrip()}
              disabled={exporting || !frame || images === null}
              size="lg"
              className="mt-4 h-14 w-full rounded-full font-display text-lg font-semibold text-ink shadow-none"
            >
              {exporting ? "Making your file..." : "Download my strip"}
            </Button>

            <p className="mt-3 text-base text-ink-soft" aria-live="polite">
              {exportMessage || "The file is a 2 by 6 inch strip, ready to print."}
            </p>

            <Link
              href="/"
              onClick={() => reset()}
              className="mt-4 inline-flex min-h-11 items-center text-base text-ink-soft underline underline-offset-4"
            >
              Start over
            </Link>
          </div>

          <div className="flex flex-col gap-8">
            <section className="rounded-card border border-line/60 bg-card p-5">
              <h2 className="font-display text-2xl text-ink">Swap your photos</h2>
              <p className="mt-2 text-base text-ink-soft">
                Photo 1 is the top of the strip.
              </p>
              <div className="mt-4">
                <ReorderList blobs={orderedBlobs} onSwap={swap} />
              </div>
            </section>

            <section className="rounded-card border border-line/60 bg-card p-5">
              <h2 className="font-display text-2xl text-ink">Pick a frame</h2>
              <p className="mt-2 text-base text-ink-soft">
                The strip changes right away when you tap one.
              </p>

              {framesError ? (
                <Alert className="mt-4 rounded-field">
                  <AlertTitle>The frames could not load</AlertTitle>
                  <AlertDescription>
                    {framesError}{" "}
                    <button
                      type="button"
                      onClick={retry}
                      className="font-semibold underline underline-offset-4"
                    >
                      Try again
                    </button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mt-4">
                  {framesLoading ? (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((slot) => (
                        <Skeleton key={slot} className="aspect-[1/3] rounded-thumb" />
                      ))}
                    </div>
                  ) : frame ? (
                    <FrameGrid
                      frames={frames}
                      value={frame.key}
                      onChange={setFrameKey}
                    />
                  ) : null}
                </div>
              )}
            </section>

            {imageError ? (
              <Alert className="rounded-field">
                <AlertTitle>Your photos did not open</AlertTitle>
                <AlertDescription>{imageError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
