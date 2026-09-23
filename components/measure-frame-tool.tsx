"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  conformWindows,
  describeConform,
  detectWindows,
  type ConformResult,
  type Detected,
} from "@/lib/frame-align";
import { SHOT_ASPECT_LABEL, windowAspect } from "@/lib/framing";

export function MeasureFrameTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [windows, setWindows] = useState<Detected[]>([]);
  const [conformed, setConformed] = useState<ConformResult[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setWindows([]);
    setConformed([]);
    setFileName(file.name);

    try {
      const url = URL.createObjectURL(file);
      const next = await loadImage(url);
      URL.revokeObjectURL(url);

      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { willReadFrequently: true });
      if (!canvas || !context) throw new Error("No canvas in this browser.");

      canvas.width = next.naturalWidth;
      canvas.height = next.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(next, 0, 0);

      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const found = detectWindows(pixels);
      const result = conformWindows(found, canvas.width, canvas.height);
      setImage(next);
      setWindows(found);
      setConformed(result);
      drawPreview(next, result, found);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That file could not be read.");
    }
  }

  const manifestEntry = {
    key: fileName.replace(/\.[^.]+$/, "") || "my-frame",
    name: "My frame",
    src: `/frames/${fileName || "my-frame.webp"}`,
    width: image?.naturalWidth ?? 600,
    height: image?.naturalHeight ?? 1800,
    layout: "strip4",
    placeholder: false,
    windows: conformed.map(({ rect }) => rect),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div>
        <label
          htmlFor="frame-file"
          className="block font-display text-lg font-semibold text-ink"
        >
          Frame file
        </label>
        <input
          id="frame-file"
          type="file"
          accept="image/webp,image/png,image/svg+xml"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
          className="mt-2 block w-full rounded-field border border-line bg-paper p-3 text-base"
        />

        <canvas
          ref={canvasRef}
          className="mt-4 hidden"
          aria-hidden="true"
        />

        <p className="mt-4 text-base text-ink-soft">
          Detected {windows.length} opening{windows.length === 1 ? "" : "s"}.
        </p>

        {windows.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
            {windows.map((window, index) => (
              <li key={index}>
                Window {index + 1}: {window.w} x {window.h} (
                {windowAspect(window).toFixed(2)}:1)
                {describeConform(window, conformed[index])}
              </li>
            ))}
          </ul>
        ) : null}

        <canvas
          ref={previewRef}
          className="mt-4 w-full rounded-thumb border border-line bg-white"
          aria-label="Preview of the frame with test panels behind it"
        />

        {error ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>That file did not load</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {windows.length > 0 && windows.length !== 4 ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>Four openings were expected</AlertTitle>
            <AlertDescription>
              This frame has {windows.length}. If the dividers between photos are
              transparent, the tool sees one opening; measure those by hand and paste
              them into the manifest.
            </AlertDescription>
          </Alert>
        ) : null}

        {conformed.some((entry) => entry.problem) ? (
          <Alert className="mt-4 rounded-field">
            <AlertTitle>
              Some openings cannot fit the {SHOT_ASPECT_LABEL} camera view
            </AlertTitle>
            <AlertDescription>
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {conformed.map((entry, index) =>
                  entry.problem ? <li key={index}>{entry.problem}</li> : null,
                )}
              </ul>
              These windows were kept as measured, so the strip crops those photos
              harder than the camera showed.
            </AlertDescription>
          </Alert>
        ) : null}

        {windows.length === 4 ? (
          <div className="mt-4 rounded-card border border-line/60 bg-card p-4">
            <h2 className="font-display text-lg text-ink">Manifest entry</h2>
            <textarea
              readOnly
              value={JSON.stringify(manifestEntry, null, 2)}
              rows={Math.min(24, windows.length * 2 + 10)}
              className="mt-2 w-full rounded-field border border-line bg-paper p-3 font-mono text-sm"
              aria-label="Manifest entry to paste"
            />
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-11 rounded-full px-5"
              onClick={() => {
                void navigator.clipboard.writeText(
                  JSON.stringify(manifestEntry, null, 2),
                );
              }}
            >
              Copy the entry
            </Button>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">How this works</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-base text-ink-soft">
          <li>Drop the frame file in. The tool scans the transparent pixels.</li>
          <li>Check the preview: each photo fills a numbered panel behind the frame.</li>
          <li>Copy the entry into public/frames/manifest.json.</li>
        </ol>
      </div>
    </div>
  );

  function drawPreview(
    frame: HTMLImageElement,
    conformed: ConformResult[],
    measured: Detected[],
  ) {
    const target = previewRef.current;
    if (!target || conformed.length === 0) return;

    target.width = frame.naturalWidth;
    target.height = frame.naturalHeight;
    const context = target.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, target.width, target.height);

    conformed.forEach(({ rect }, index) => {
      const colours = ["#a8d8f0", "#f7c8d4", "#ffd98e", "#9a8cc2"];
      context.fillStyle = colours[index % colours.length];
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
      context.fillStyle = "#2a2140";
      context.font = `${Math.round(rect.h / 2)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + rect.h / 2);
    });

    // The measured opening inside the grown window, so it stays visible while
    // checking the frame.
    context.setLineDash([8, 6]);
    context.strokeStyle = "#2a2140";
    context.lineWidth = 2;
    measured.forEach((rect, index) => {
      const grown = conformed[index]?.rect;
      const same =
        grown &&
        grown.x === rect.x &&
        grown.y === rect.y &&
        grown.w === rect.w &&
        grown.h === rect.h;
      if (!same) context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    context.setLineDash([]);

    context.drawImage(frame, 0, 0);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be decoded."));
    image.src = src;
  });
}
