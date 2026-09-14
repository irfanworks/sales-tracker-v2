"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateStrongPassword } from "@/lib/password";
import { UserPlus, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validation = validateStrongPassword(password);
    if (!validation.valid) {
      setError("Password lemah: " + validation.errors.join(", ").toLowerCase());
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi tidak sama.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setSuccess(true);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h1 className="text-xl font-semibold text-slate-800 mb-2">
              Akun berhasil dibuat
            </h1>
            <p className="text-slate-600 text-sm mb-6">
              Jika email konfirmasi diaktifkan, cek inbox Anda. Jika tidak, Anda
              akan diarahkan ke dashboard.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 text-white py-2.5 px-5 font-medium hover:bg-primary-800"
            >
              Masuk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-slate-800">
              Sales Tracker
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Daftar akun baru
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="nama@perusahaan.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-slate-500">
                Min 8 karakter, huruf besar, huruf kecil, angka, dan spesial
              </p>
            </div>
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Konfirmasi Password
              </label>
              <input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-700 text-white py-2.5 px-4 font-medium hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
