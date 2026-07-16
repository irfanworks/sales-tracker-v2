import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";

function LoginFormFallback() {
  return (
    <div className="card-elevated w-full max-w-md p-8">
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center app-shell-bg px-4 py-8">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
