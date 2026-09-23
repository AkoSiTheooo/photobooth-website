export type CameraProblem =
  | "blocked"
  | "missing"
  | "busy"
  | "insecure"
  | "unsupported"
  | "unknown";

export class CameraFailure extends Error {
  constructor(
    readonly problem: CameraProblem,
    message: string,
  ) {
    super(message);
    this.name = "CameraFailure";
  }
}

const MESSAGES: Record<CameraProblem, string> = {
  blocked:
    "The camera is switched off for this page. Allow the camera in your browser, then try again.",
  missing: "No camera was found on this device.",
  busy: "Another app is using the camera. Close it, then try again.",
  insecure: "The camera needs a secure page. Use https or localhost.",
  unsupported: "This browser cannot show the camera.",
  unknown: "The camera did not start. Try again.",
};

export function cameraMessage(problem: CameraProblem) {
  return MESSAGES[problem];
}

export async function startCamera(video: HTMLVideoElement) {
  if (!window.isSecureContext) {
    throw new CameraFailure("insecure", MESSAGES.insecure);
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraFailure("unsupported", MESSAGES.unsupported);
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
    return stream;
  } catch (cause) {
    throw new CameraFailure(problemFor(cause), MESSAGES[problemFor(cause)]);
  }
}

function problemFor(cause: unknown): CameraProblem {
  const name = cause instanceof DOMException ? cause.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "blocked";
    case "NotFoundError":
    case "OverconstrainedError":
      return "missing";
    case "NotReadableError":
    case "AbortError":
      return "busy";
    default:
      return "unknown";
  }
}

export function stopCamera(stream: MediaStream | null, video: HTMLVideoElement | null) {
  stream?.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

const MAX_EDGE = 2048;

// Snapshot of what the child sees: the middle square of the camera frame,
// capped at 2048 px so a 2 x 6 strip stays sharp without holding full sensor
// frames in memory.
export function capturePhoto(video: HTMLVideoElement, mirror: boolean): Promise<Blob> {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("The camera is still warming up. Try again in a moment.");
  }

  // The preview shows the middle square of the stream, so the stored photo
  // keeps the same pixels on any camera shape, phone or webcam.
  const side = Math.min(sourceWidth, sourceHeight);
  const sourceX = (sourceWidth - side) / 2;
  const sourceY = (sourceHeight - side) / 2;

  const scale = Math.min(1, MAX_EDGE / side);
  const size = Math.round(side * scale);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot take the photo.");

  if (mirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sourceX, sourceY, side, side, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The photo could not be saved."));
      },
      "image/jpeg",
      0.92,
    );
  });
}

export function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
