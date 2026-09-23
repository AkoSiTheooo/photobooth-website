import Link from "next/link";
import { MeasureFrameTool } from "@/components/measure-frame-tool";

// Admin-only: the /dev layout and the proxy gate this route.
export default function MeasureFramePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
      >
        Back to the photo desk
      </Link>
      <h1 className="mt-6 font-display text-3xl text-ink">Measure a frame</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        This page finds the photo windows inside a frame file and writes the manifest
        entry for it. Only the admin can open this page.
      </p>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        To re-measure every frame in the manifest at once, run{" "}
        <code className="font-mono text-sm">npm run align-frames</code> instead.
      </p>
      <div className="mt-8">
        <MeasureFrameTool />
      </div>
    </main>
  );
}
