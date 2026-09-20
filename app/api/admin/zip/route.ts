import JSZip from "jszip";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("photo_sessions")
    .select("id, created_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: captures, error: captureError } = await supabase
    .from("photo_captures")
    .select("shot_index, storage_path")
    .eq("session_id", sessionId)
    .order("shot_index");

  if (captureError || !captures?.length) {
    return NextResponse.json({ error: "no_photos" }, { status: 404 });
  }

  const zip = new JSZip();
  for (const capture of captures) {
    const { data: file } = await supabase.storage
      .from("originals")
      .download(capture.storage_path);
    if (!file) continue;
    zip.file(
      `shot-${String(capture.shot_index).padStart(2, "0")}.jpg`,
      await file.arrayBuffer(),
    );
  }

  const archive = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(archive, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="PhotoToy-${session.created_at.slice(0, 16).replace(/[:T]/g, "-")}.zip"`,
    },
  });
}
