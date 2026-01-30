import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Enercon Indonesia" className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Enercon Indonesia&apos;s Sales Tracker</h1>
          <p className="mt-2 text-slate-600">Sign in to manage projects and customers.</p>
        </div>
        <Link
          href="/login"
          className="btn-primary inline-flex w-full items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      </div>
    </div>
  );
}
