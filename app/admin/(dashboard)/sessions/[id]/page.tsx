import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDeleteSession } from "@/components/admin-delete-session";
import { LocalTime } from "@/components/local-time";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("photo_sessions")
    .select("id, created_at, layout, photo_count, mirror")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const { data: captures } = await supabase
    .from("photo_captures")
    .select("shot_index, storage_path")
    .eq("session_id", id)
    .order("shot_index");

  const ordered = captures ?? [];
  const { data: signed, error: signedError } = ordered.length
    ? await supabase.storage
        .from("originals")
        .createSignedUrls(
          ordered.map((capture) => capture.storage_path),
          600,
        )
    : { data: [], error: null };

  const urlByPath = new Map(
    (signed ?? []).map((entry) => [entry.path, entry.signedUrl]),
  );

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
      >
        Back to the photo desk
      </Link>

      <h1 className="mt-4 font-display text-3xl text-ink">
        Visit from <LocalTime iso={session.created_at} />
      </h1>
      <p className="mt-2 text-base text-ink-soft">
        {session.photo_count} photos, {session.mirror ? "mirrored" : "not mirrored"},
        saved as taken. The frame is not part of the archive copy.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild className="h-11 rounded-full px-5 font-semibold text-ink">
          <a href={`/api/admin/zip?session=${session.id}`}>Download all as a ZIP</a>
        </Button>
        <AdminDeleteSession sessionId={session.id} />
      </div>

      {signedError ? (
        <Alert className="mt-6 rounded-field">
          <AlertTitle>Previews are unavailable</AlertTitle>
          <AlertDescription>
            {signedError.message} The downloads below still work.
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((capture) => {
          const url = urlByPath.get(capture.storage_path);
          return (
            <li
              key={capture.shot_index}
              className="rounded-card border border-line/60 bg-card p-3"
            >
              <h2 className="font-display text-lg text-ink">Photo {capture.shot_index}</h2>
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- private file behind a signed URL
                <img
                  src={url}
                  alt={`Photo ${capture.shot_index} from this visit`}
                  className="mt-2 w-full rounded-thumb border border-line/60 object-cover"
                />
              ) : (
                <p className="mt-2 text-base text-ink-soft">Preview unavailable.</p>
              )}
              <a
                href={`/api/admin/original?session=${session.id}&shot=${capture.shot_index}`}
                className="mt-3 inline-flex min-h-11 items-center rounded-full px-1 text-base underline underline-offset-4"
              >
                Download photo {capture.shot_index}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
