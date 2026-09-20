"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { data: captures } = await supabase
    .from("photo_captures")
    .select("storage_path")
    .eq("session_id", sessionId);

  const paths = captures?.map((capture) => capture.storage_path) ?? [];
  if (paths.length > 0) {
    await supabase.storage.from("originals").remove(paths);
  }

  // Captures cascade with the session row.
  await supabase.from("photo_sessions").delete().eq("id", sessionId);
  redirect("/admin");
}
