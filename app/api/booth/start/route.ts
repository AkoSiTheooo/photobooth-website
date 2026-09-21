import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Issues the short-lived credential the booth uploads with: a session id that
// only accepts photos for two hours.
export async function POST(request: Request) {
  const mirror = await readMirror(request);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc("start_booth_session", {
    p_mirror: mirror,
  });

  if (error) {
    return NextResponse.json({ error: "start_failed" }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data });
}

async function readMirror(request: Request) {
  try {
    const body = (await request.json()) as { mirror?: boolean };
    return body.mirror !== false;
  } catch {
    return true;
  }
}
