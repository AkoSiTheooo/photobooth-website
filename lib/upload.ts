import { createClient } from "@/lib/supabase/client";

// Saves the untouched shots for the organizer. Called when the visitor accepts
// their set, so a retake never fills the archive.
export async function saveOriginals(shots: Blob[], mirror: boolean): Promise<void> {
  const sessionId = await startSession(mirror);
  const supabase = createClient();
  const paths: string[] = [];

  for (const [index, shot] of shots.entries()) {
    const path = `sessions/${sessionId}/shot-${index + 1}.jpg`;
    const { error } = await supabase.storage
      .from("originals")
      .upload(path, shot, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error("The photos could not be saved for the organizer.");
    paths.push(path);
  }

  // One batch insert: rows come after the files, so a failed upload never leaves
  // the dashboard pointing at a missing photo.
  const { error: rowError } = await supabase.from("photo_captures").insert(
    paths.map((storagePath, index) => ({
      session_id: sessionId,
      shot_index: index + 1,
      storage_path: storagePath,
    })),
  );

  if (rowError) throw new Error("The photos could not be saved for the organizer.");
}

async function startSession(mirror: boolean) {
  const response = await fetch("/api/booth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mirror }),
  });

  if (!response.ok) throw new Error("The organizer copy could not start.");

  const { sessionId } = (await response.json()) as { sessionId: string };
  return sessionId;
}
