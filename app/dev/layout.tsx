import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DevLayout({ children }: LayoutProps<"/dev">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (!email) redirect("/admin/login");

  return children;
}
