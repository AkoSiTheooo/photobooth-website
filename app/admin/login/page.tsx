import { AdminLoginForm } from "@/components/admin-login-form";
import { Wordmark } from "@/components/wordmark";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Wordmark className="text-2xl" />
        <h1 className="mt-6 font-display text-3xl text-ink">Photo desk sign in</h1>
        <p className="mt-2 text-base text-ink-soft">
          For the organizer. Visitors never need an account.
        </p>
        <AdminLoginForm />
      </div>
    </main>
  );
}
