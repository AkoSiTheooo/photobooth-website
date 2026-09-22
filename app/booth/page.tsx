"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoothProgress } from "@/components/booth-progress";
import { BigSwitch } from "@/components/big-switch";
import { useBooth } from "@/components/booth-context";
import { ShotRail } from "@/components/shot-rail";
import { Wordmark } from "@/components/wordmark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CameraFailure, capturePhoto, startCamera, stopCamera, wait } from "@/lib/capture";
import { SHOT_ASPECT } from "@/lib/framing";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { loadBoothSounds, type BoothSounds } from "@/lib/sounds";
import { saveOriginals } from "@/lib/upload";

const SHOT_COUNT = 4;
const TIMERS = [3, 5, 10] as const;
const FLASH_MS = 160;
const BETWEEN_SHOTS_MS = 700;

type TimerChoice = (typeof TIMERS)[number];

type CameraState = "starting" | "ready" | "error";

type Phase =
  | { kind: "idle" }
  | { kind: "countdown"; shot: number; remaining: number }
  | { kind: "flash"; shot: number }
  | { kind: "review" };

type Upload = "idle" | "saving" | "failed";

export default function BoothPage() {
  const router = useRouter();
  const { shots, setShots } = useBooth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);
  const soundsRef = useRef<BoothSounds | null>(null);

  const [camera, setCamera] = useState<CameraState>("starting");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [mirror, setMirror] = useState(true);
  const [timer, setTimer] = useState<TimerChoice>(3);
  const [muted, setMuted] = useState(false);
  const [soundAvailable, setSoundAvailable] = useState(false);
  const [upload, setUpload] = useState<Upload>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mirrorRef = useRef(mirror);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mirrorRef.current = mirror;
  }, [mirror]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // A bright flash is the one piece of the booth that should not run for
  // visitors who asked for less motion.
  const reducedMotion = useReducedMotion();

  // The retry button re-runs the camera effect by bumping the attempt.
  function retryCamera() {
    setCamera("starting");
    setCameraError(null);
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    (async () => {
      try {
        const stream = await startCamera(video);
        if (cancelled) {
          stopCamera(stream, video);
          return;
        }
        streamRef.current = stream;
        setCamera("ready");
        setCameraError(null);
      } catch (cause) {
        if (!cancelled) {
          setCameraError(
            cause instanceof CameraFailure ? cause.message : "The camera did not start.",
          );
          setCamera("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelRef.current = true;
      stopCamera(streamRef.current, video);
      streamRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    loadBoothSounds().then((sounds) => {
      soundsRef.current = sounds;
      setSoundAvailable(sounds.available);
    });
  }, []);

  const busy = phase.kind === "countdown" || phase.kind === "flash";

  const runSequence = useCallback(async () => {
    const video = videoRef.current;
    if (!video || camera !== "ready") return;

    cancelRef.current = false;
    setUpload("idle");
    setUploadError(null);
    setShots([]);

    const captured: Blob[] = [];

    for (let shot = 1; shot <= SHOT_COUNT; shot += 1) {
      for (let remaining = timer; remaining > 0; remaining -= 1) {
        setPhase({ kind: "countdown", shot, remaining });
        soundsRef.current?.tick(mutedRef.current);
        await wait(1000);
        if (cancelRef.current) return;
      }

      setPhase({ kind: "flash", shot });
      soundsRef.current?.shutter(mutedRef.current);

      try {
        captured.push(await capturePhoto(video, mirrorRef.current));
        setShots([...captured]);
      } catch (cause) {
        setCameraError(
          cause instanceof Error ? cause.message : "The photo could not be saved.",
        );
        setCamera("error");
        setPhase({ kind: "idle" });
        return;
      }

      await wait(FLASH_MS + BETWEEN_SHOTS_MS);
      if (cancelRef.current) return;
    }

    setPhase({ kind: "review" });
  }, [camera, setShots, timer]);

  function stopSequence() {
    cancelRef.current = true;
    setPhase({ kind: "idle" });
  }

  async function keepPhotos() {
    setUpload("saving");
    setUploadError(null);
    try {
      await saveOriginals(shots, mirror);
      router.push("/customize");
    } catch (cause) {
      setUpload("failed");
      setUploadError(
        cause instanceof Error ? cause.message : "The photos could not be saved.",
      );
    }
  }

  const shotLabel =
    phase.kind === "countdown" || phase.kind === "flash"
      ? `Photo ${phase.shot} of ${SHOT_COUNT}`
      : null;

  return (
    <div className="stage flex flex-1 flex-col px-5 py-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Wordmark tone="stage" className="text-lg" />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-stage-muted underline-offset-4 hover:text-stage-text hover:underline"
        >
          Back to start
        </Link>
      </header>

      <main className="mx-auto mt-6 grid w-full max-w-6xl flex-1 content-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative">
          <div className="relative overflow-hidden rounded-card bg-black/50">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Camera view"
              className="w-full object-cover"
              style={{
                aspectRatio: SHOT_ASPECT,
                ...(mirror ? { transform: "scaleX(-1)" } : {}),
              }}
            />

            {phase.kind === "flash" && !reducedMotion ? (
              <span
                aria-hidden="true"
                className="animate-booth-flash pointer-events-none absolute inset-0 bg-white"
              />
            ) : null}

            {phase.kind === "countdown" ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span className="animate-in font-display text-8xl font-semibold text-ink duration-200 zoom-in-75 sm:text-9xl">
                  {phase.remaining}
                </span>
              </span>
            ) : null}

            {camera === "starting" ? (
              <span className="absolute inset-0 flex items-center justify-center text-lg text-stage-text">
                Waking up the camera...
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-base text-stage-muted">
            Your strip keeps this view.
          </p>

          {cameraError ? (
            <Alert className="mt-4 rounded-field border-stage-line bg-stage-raised text-stage-text">
              <AlertTitle>The camera needs a hand</AlertTitle>
              <AlertDescription>
                {cameraError}{" "}
                <button
                  type="button"
                  onClick={retryCamera}
                  className="font-semibold underline underline-offset-4"
                >
                  Try the camera again
                </button>
              </AlertDescription>
            </Alert>
          ) : null}

          <BoothProgress
            shotLabel={shotLabel}
            message={
              phase.kind === "countdown"
                ? "Get ready to smile"
                : phase.kind === "flash"
                  ? "Got it!"
                  : phase.kind === "review"
                    ? "All four photos are here"
                    : null
            }
          />
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-card bg-stage-raised p-5">
            <BigSwitch
              label="Mirror the camera"
              checked={mirror}
              onCheckedChange={setMirror}
              disabled={busy}
            />

            <fieldset className="mt-5" disabled={busy}>
              <legend className="text-base text-stage-text">Countdown before each photo</legend>
              <RadioGroup
                value={String(timer)}
                onValueChange={(value) => setTimer(Number(value) as TimerChoice)}
                className="mt-3 grid grid-cols-3 gap-2"
              >
                {TIMERS.map((seconds) => (
                  <Label
                    key={seconds}
                    htmlFor={`timer-${seconds}`}
                    className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-chip border border-stage-line text-base text-stage-text has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-butter has-data-[state=checked]:border-butter has-data-[state=checked]:bg-butter has-data-[state=checked]:text-ink"
                  >
                    <RadioGroupItem
                      id={`timer-${seconds}`}
                      value={String(seconds)}
                      className="sr-only"
                    />
                    <span className="font-display text-xl font-semibold">{seconds}</span>
                    <span className="text-sm">seconds</span>
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            {soundAvailable ? (
              <BigSwitch
                label="Sound"
                checked={!muted}
                onCheckedChange={(on) => setMuted(!on)}
              />
            ) : null}

            <div className="mt-6">
              {phase.kind === "review" ? (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => void keepPhotos()}
                    disabled={upload === "saving"}
                    size="lg"
                    className="h-14 rounded-full font-display text-lg font-semibold text-ink shadow-none"
                  >
                    {upload === "saving" ? "Saving your photos..." : "Use these photos"}
                  </Button>
                  <Button
                    onClick={() => void runSequence()}
                    disabled={upload === "saving"}
                    variant="outline"
                    size="lg"
                    className="h-14 rounded-full border-stage-line bg-transparent font-display text-lg font-semibold text-stage-text hover:bg-stage hover:text-stage-text"
                  >
                    Take these photos again
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => (busy ? stopSequence() : void runSequence())}
                  disabled={camera !== "ready"}
                  size="lg"
                  className="h-14 w-full rounded-full font-display text-lg font-semibold text-ink shadow-none"
                >
                  {busy ? "Stop" : "Start the countdown"}
                </Button>
              )}
            </div>

            {upload === "failed" && uploadError ? (
              <Alert className="mt-4 rounded-field border-butter bg-stage text-stage-text">
                <AlertTitle>Your photos are safe here</AlertTitle>
                <AlertDescription>
                  {uploadError} You can still make your strip, or{" "}
                  <button
                    type="button"
                    onClick={() => void keepPhotos()}
                    className="font-semibold underline underline-offset-4"
                  >
                    try saving again
                  </button>
                  .
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="rounded-card bg-stage-raised p-5">
            <h2 className="font-display text-lg font-semibold text-stage-text">Your four photos</h2>
            <ShotRail shots={shots} count={SHOT_COUNT} className="mt-3" />
            <p className="mt-3 text-base text-stage-muted">
              Happy with them? Tap &ldquo;Use these photos&rdquo; and pick a frame.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
