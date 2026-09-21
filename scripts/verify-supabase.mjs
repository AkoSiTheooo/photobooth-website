// Checks what a visitor with the public key can and cannot do. Run:
//   node scripts/verify-supabase.mjs
// It leaves a few throwaway session rows behind; the output prints the ids to
// clean them up with.

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const auth = { apikey: key, Authorization: `Bearer ${key}` };
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function json(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const sessions = await fetch(`${url}/rest/v1/photo_sessions?select=id`, { headers: auth });
const sessionRows = await json(sessions);
record(
  "visitor cannot list sessions",
  Array.isArray(sessionRows) && sessionRows.length === 0,
  `HTTP ${sessions.status}, ${Array.isArray(sessionRows) ? `${sessionRows.length} rows` : "no array"}`,
);

const captures = await fetch(`${url}/rest/v1/photo_captures?select=id`, { headers: auth });
const captureRows = await json(captures);
record(
  "visitor cannot list captures",
  Array.isArray(captureRows) && captureRows.length === 0,
  `HTTP ${captures.status}, ${Array.isArray(captureRows) ? `${captureRows.length} rows` : "no array"}`,
);

const forgedCapture = await fetch(`${url}/rest/v1/photo_captures`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({
    session_id: "00000000-0000-0000-0000-000000000000",
    shot_index: 1,
    storage_path: "sessions/forged/shot-1.jpg",
  }),
});
record(
  "visitor cannot attach photos to a session that is not open",
  forgedCapture.status >= 400,
  `HTTP ${forgedCapture.status}`,
);

const forgedSession = await fetch(`${url}/rest/v1/photo_sessions`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ mirror: true }),
});
record(
  "visitor cannot create a session directly",
  forgedSession.status >= 400,
  `HTTP ${forgedSession.status}`,
);

const publicObject = await fetch(
  `${url}/storage/v1/object/public/originals/sessions/none/shot-1.jpg`,
);
record(
  "originals bucket is not public",
  publicObject.status >= 400,
  `HTTP ${publicObject.status}`,
);

const unsignedObject = await fetch(`${url}/storage/v1/object/originals/sessions/none/shot-1.jpg`);
record(
  "originals need a signed URL",
  unsignedObject.status >= 400,
  `HTTP ${unsignedObject.status}`,
);

// The cap that used to sit here (12 per hour per IP, 240 globally) is gone;
// 13 starts in a row, one past the old boundary, all have to succeed.
const createdSessionIds = [];
for (let attempt = 1; attempt <= 13; attempt += 1) {
  const response = await fetch(`${url}/rest/v1/rpc/start_booth_session`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ p_mirror: true }),
  });
  const body = await json(response);
  if (
    response.ok &&
    typeof body === "string" &&
    !createdSessionIds.includes(body)
  ) {
    createdSessionIds.push(body);
  }
}
record(
  "the booth issuer opens sessions without a cap",
  createdSessionIds.length === 13,
  `${createdSessionIds.length} issued`,
);

// The positive path matters as much as the refusals: a session the server just
// issued has to accept its capture row and its file.
const start = await fetch(`${url}/rest/v1/rpc/start_booth_session`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json" },
  body: JSON.stringify({ p_mirror: true }),
});
const sessionId = await json(start);
if (typeof sessionId === "string") createdSessionIds.push(sessionId);
const storagePath = `sessions/${sessionId}/shot-1.jpg`;

const allowedCapture = await fetch(`${url}/rest/v1/photo_captures`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ session_id: sessionId, shot_index: 1, storage_path: storagePath }),
});
record(
  "an open session accepts a capture row",
  allowedCapture.status < 300,
  `HTTP ${allowedCapture.status}`,
);

const allowedUpload = await fetch(`${url}/storage/v1/object/originals/${storagePath}`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "image/jpeg" },
  body: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
});
record(
  "an open session accepts an upload",
  allowedUpload.status < 300,
  `HTTP ${allowedUpload.status}${allowedUpload.ok ? "" : ` ${await allowedUpload.text()}`}`,
);

const wrongPath = await fetch(`${url}/storage/v1/object/originals/sessions/elsewhere/shot-1.jpg`, {
  method: "POST",
  headers: { ...auth, "Content-Type": "image/jpeg" },
  body: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
});
record(
  "an upload outside the session folder is refused",
  wrongPath.status >= 400,
  `HTTP ${wrongPath.status}`,
);

console.log("");
for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.name} (${result.detail})`);
}
console.log("");
console.log(
  `Clean up with: delete from public.photo_sessions where id in ('${createdSessionIds.join("', '")}');`,
);
const failed = results.filter((result) => !result.ok).length;
process.exit(failed === 0 ? 0 : 1);
