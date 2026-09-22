import { aspectDeviation, ASPECT_WARN_THRESHOLD } from "@/lib/framing";

export type FrameWindow = { x: number; y: number; w: number; h: number };

export type FrameDefinition = {
  key: string;
  name: string;
  src: string;
  width: number;
  height: number;
  layout: string;
  placeholder: boolean;
  windows: FrameWindow[];
};

type FrameManifest = {
  version: number;
  frames: FrameDefinition[];
};

const MANIFEST_URL = "/frames/manifest.json";
const KNOWN_LAYOUTS = ["strip4"] as const;

let cached: Promise<FrameDefinition[]> | null = null;

// The manifest is fetched, not imported, so a frame can be added by dropping the
// file into public/frames and editing the JSON. A failure clears the cache so a
// retry really retries.
export function loadFrames(): Promise<FrameDefinition[]> {
  cached ??= fetchFrames().catch((cause: unknown) => {
    cached = null;
    throw cause;
  });
  return cached;
}

async function fetchFrames(): Promise<FrameDefinition[]> {
  const response = await fetch(MANIFEST_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Frame manifest not found at ${MANIFEST_URL}`);
  }

  const manifest = (await response.json()) as FrameManifest;
  if (!Array.isArray(manifest.frames) || manifest.frames.length === 0) {
    throw new Error("Frame manifest lists no frames.");
  }

  for (const frame of manifest.frames) {
    assertFrame(frame);
  }

  return manifest.frames;
}

function assertFrame(frame: FrameDefinition) {
  const label = frame.key || "(missing key)";

  if (!KNOWN_LAYOUTS.includes(frame.layout as (typeof KNOWN_LAYOUTS)[number])) {
    throw new Error(`Frame ${label} uses an unknown layout: ${frame.layout}`);
  }
  if (frame.windows.length !== 4) {
    throw new Error(
      `Frame ${label} has ${frame.windows.length} windows, expected 4 for ${frame.layout}.`,
    );
  }
  for (const [index, window] of frame.windows.entries()) {
    const insideFrame =
      window.x >= 0 &&
      window.y >= 0 &&
      window.w > 0 &&
      window.h > 0 &&
      window.x + window.w <= frame.width &&
      window.y + window.h <= frame.height;
    if (!insideFrame) {
      throw new Error(
        `Frame ${label} window ${index + 1} sits outside the ${frame.width}x${frame.height} canvas.`,
      );
    }

    const deviation = aspectDeviation(window);
    if (
      process.env.NODE_ENV !== "production" &&
      Math.abs(deviation) > ASPECT_WARN_THRESHOLD
    ) {
      console.warn(
        `Frame ${label}: window ${index + 1} is ${Math.abs(Math.round(deviation * 100))}% ${
          deviation > 0 ? "wider" : "taller"
        } than the camera view, so it crops the photo. Open /dev/measure-frame to conform it.`,
      );
    }
  }
}

export function loadFrameImage(frame: FrameDefinition): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Frame image failed to load: ${frame.src}`));
    image.src = frame.src;
  });
}
