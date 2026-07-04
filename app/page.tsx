import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogIn, BarChart3, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen app-shell-bg">
      <div className="page-stagger mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 sm:max-w-xl">
        <div className="animate-slide-up text-center">
          <Image
            src="/logo.png"
            alt="Enercon Indonesia"
            width={88}
            height={88}
            className="mx-auto h-20 w-20 object-contain sm:h-24 sm:w-24"
            priority
          />
          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Enercon Sales Tracker
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-500">
            Manage projects, customers, and pipeline performance in one place.
          </p>
        </div>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          {[
            { icon: FolderKanban, label: "Projects" },
            { icon: Users, label: "Customers" },
            { icon: BarChart3, label: "Analytics" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="card flex flex-col items-center gap-2 p-4 text-center sm:p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </div>
          ))}
        </div>

        <Link href="/login" className="btn-primary mt-10 w-full max-w-sm sm:w-auto sm:min-w-[200px]">
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      </div>
    </div>
  );
}
