"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles Supabase implicit-flow redirects where the session
 * arrives as a URL hash fragment (#access_token=...&refresh_token=...).
 * The server-side /auth/callback handles PKCE (code= param).
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      router.replace("/login?error=" + encodeURIComponent("Link invalido o expirado."));
      return;
    }

    const params = new URLSearchParams(hash.substring(1)); // remove leading #
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type"); // "recovery" for password reset

    if (!access_token || !refresh_token) {
      router.replace("/login?error=" + encodeURIComponent("Link invalido o expirado."));
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setStatus("error");
        router.replace("/login?error=" + encodeURIComponent("El link expiro. Solicita uno nuevo."));
      } else if (type === "recovery") {
        router.replace("/cambiar-password");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Link invalido o expirado.</p>
          <a href="/olvide-password" className="text-sm text-blue-600 hover:underline mt-2 block">
            Solicitar nuevo link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Verificando tu link...</p>
      </div>
    </div>
  );
}
