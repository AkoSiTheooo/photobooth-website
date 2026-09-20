import Link from "next/link";

export default function SessionNotFound() {
  return (
    <div className="rounded-card border border-line/60 bg-card p-6">
      <h1 className="font-display text-2xl text-ink">That visit is not here</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        It may have been deleted already. The photo desk still has the rest.
      </p>
      <Link
        href="/admin"
        className="mt-4 inline-flex min-h-11 items-center rounded-full px-5 text-base underline underline-offset-4"
      >
        Back to the photo desk
      </Link>
    </div>
  );
}
