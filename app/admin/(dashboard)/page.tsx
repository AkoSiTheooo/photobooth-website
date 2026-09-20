import Link from "next/link";
import { LocalTime } from "@/components/local-time";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  created_at: string;
  layout: string;
  photo_count: number;
  mirror: boolean;
  photo_captures: { shot_index: number; storage_path: string }[];
};

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from, to } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("photo_sessions")
    .select(
      "id, created_at, layout, photo_count, mirror, photo_captures (shot_index, storage_path)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const { data, error } = await query;
  const sessions = (data ?? []) as SessionRow[];
  const filtered = Boolean(from || to);

  const previewPaths = sessions
    .map((session) => {
      const first = [...session.photo_captures].sort(
        (a, b) => a.shot_index - b.shot_index,
      )[0];
      return first?.storage_path ?? null;
    })
    .filter((path): path is string => path !== null);

  const { data: signed } = previewPaths.length
    ? await supabase.storage.from("originals").createSignedUrls(previewPaths, 600)
    : { data: [] };

  const urlByPath = new Map(
    (signed ?? []).map((entry) => [entry.path, entry.signedUrl]),
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Photo desk</h1>
      <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
        Every accepted booth visit lands here: the four originals, the time they were
        taken, and whether the camera was mirrored.
      </p>

      {error ? (
        <Alert className="mt-6 rounded-field">
          <AlertTitle>The list could not load</AlertTitle>
          <AlertDescription>
            {error.message} Reload the page to try again.
          </AlertDescription>
        </Alert>
      ) : null}

      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from" className="text-sm text-ink-soft">
            From
          </Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="h-11 rounded-field border-line bg-paper"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to" className="text-sm text-ink-soft">
            To
          </Label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="h-11 rounded-field border-line bg-paper"
          />
        </div>
        <Button type="submit" variant="outline" className="h-11 rounded-full px-5">
          Show these dates
        </Button>
        {filtered ? (
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <p className="mt-3 text-sm text-ink-soft">
        Dates are matched in UTC. Times below are shown in your own time zone.
      </p>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-card border border-line/60 bg-card p-6">
          <h2 className="font-display text-xl text-ink">
            {filtered ? "Nothing on those dates" : "No visits yet"}
          </h2>
          <p className="mt-2 max-w-[60ch] text-base text-ink-soft">
            {filtered
              ? "Clear the filter to see every visit, or pick a wider range."
              : "Photos appear here as soon as a visitor finishes a booth visit and taps Use these photos."}
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-4 h-11 rounded-full px-5"
          >
            <Link href={filtered ? "/admin" : "/booth"}>
              {filtered ? "Clear the filter" : "Open the booth"}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Photos</TableHead>
                <TableHead>Camera</TableHead>
                <TableHead>First photo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const preview = [...session.photo_captures].sort(
                  (a, b) => a.shot_index - b.shot_index,
                )[0];
                const url = preview ? urlByPath.get(preview.storage_path) : null;

                return (
                  <TableRow key={session.id}>
                    <TableCell className="whitespace-nowrap">
                      <LocalTime iso={session.created_at} />
                    </TableCell>
                    <TableCell>{session.photo_count}</TableCell>
                    <TableCell>
                      {session.mirror ? "Mirrored" : "Not mirrored"}
                    </TableCell>
                    <TableCell>
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- private file behind a signed URL
                        <img
                          src={url}
                          alt={`First photo of the visit at ${session.created_at}`}
                          className="h-12 w-16 rounded-[8px] border border-line/60 object-cover"
                        />
                      ) : (
                        <span className="text-base text-ink-soft">No preview</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="inline-flex min-h-11 items-center rounded-full px-3 text-base underline underline-offset-4"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
