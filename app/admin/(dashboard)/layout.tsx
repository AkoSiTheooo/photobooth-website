import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/(dashboard)/actions";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (!email) redirect("/admin/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line/60 bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-4">
            <Wordmark className="text-lg" />
            <span className="text-base text-ink-soft">Photo desk</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">{email}</span>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full px-3 text-base text-ink-soft underline-offset-4 hover:underline"
            >
              Open the booth
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="outline" className="h-11 rounded-full px-5">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
