import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Streams one original with a real download header. A signed URL would open the
// image in a tab instead of saving it, because the download attribute is ignored
// across origins.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const sessionId = params.get("session");
  const shot = Number(params.get("shot"));

  if (!sessionId || !Number.isInteger(shot) || shot < 1) {
    return NextResponse.json({ error: "missing_photo" }, { status: 400 });
  }

  const { data: capture } = await supabase
    .from("photo_captures")
    .select("storage_path")
    .eq("session_id", sessionId)
    .eq("shot_index", shot)
    .maybeSingle();

  if (!capture) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: file } = await supabase.storage
    .from("originals")
    .download(capture.storage_path);

  if (!file) {
    return NextResponse.json({ error: "missing_file" }, { status: 404 });
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="PhotoToy-shot-${shot}.jpg"`,
    },
  });
}
