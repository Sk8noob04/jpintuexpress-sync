"use client";

import { useState } from "react";
import { resetearPassword } from "./actions";

interface Props {
  userId: string;
  userName: string;
}

export default function ResetPasswordButton({ userId, userName }: Props) {
  const [result, setResult] = useState<{ error?: string; tempPassword?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleReset() {
    if (!confirm(`Resetear contrasena de "${userName}"?`)) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("id", userId);
    const res = await resetearPassword(fd);
    setResult(res as any);
    setLoading(false);
    if ((res as any).ok) setOpen(true);
  }

  return (
    <span className="inline-block">
      <button
        onClick={handleReset}
        disabled={loading}
        className="text-xs text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50"
      >
        {loading ? "..." : "Resetear pw"}
      </button>

      {open && result?.tempPassword && (
        <span className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Contrasena reseteada</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Nueva contrasena temporal para <strong className="text-gray-900 dark:text-gray-100">{userName}</strong>:
            </p>
            <code className="block bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 mb-4">
              {result.tempPassword}
            </code>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              El usuario debera cambiarla en su proximo inicio de sesion.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
            >
              Cerrar
            </button>
          </div>
        </span>
      )}
    </span>
  );
}
