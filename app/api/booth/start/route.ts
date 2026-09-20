import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

// Issues the short-lived credential the booth uploads with: a session id that
// only accepts photos for two hours. Rate limiting happens in the database
// function so it holds across serverless instances.
export async function POST(request: Request) {
  const mirror = await readMirror(request);
  const ipHash = hashIp(clientIp(request));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc("start_booth_session", {
    p_mirror: mirror,
    p_ip_hash: ipHash,
  });

  if (error) {
    const rateLimited = error.message.includes("rate_limited");
    return NextResponse.json(
      { error: rateLimited ? "rate_limited" : "start_failed" },
      { status: rateLimited ? 429 : 500 },
    );
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

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}

function hashIp(ip: string) {
  const salt = process.env.UPLOAD_IP_SALT ?? "phototoy-local-dev";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
