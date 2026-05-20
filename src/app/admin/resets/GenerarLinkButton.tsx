"use client";

import { useState } from "react";
import { generarLinkReset } from "./actions";

interface Props {
  requestId: string;
  email: string;
}

export default function GenerarLinkButton({ requestId, email }: Props) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("id", requestId);
    fd.append("email", email);
    const res = await generarLinkReset(fd) as any;
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setLink(res.link);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (link) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg w-full shadow-xl">
          <h3 className="font-semibold text-gray-900 mb-1">Link de recuperacion generado</h3>
          <p className="text-sm text-gray-500 mb-4">
            Copia este link y enviaselo a <strong>{email}</strong>. Expira en 24 horas.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 break-all text-xs text-gray-700 font-mono select-all">
            {link}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white
                         font-semibold rounded-lg text-sm transition"
            >
              {copied ? "Copiado!" : "Copiar link"}
            </button>
            <button
              onClick={() => setLink(null)}
              className="py-2.5 px-4 border border-gray-300 text-gray-700
                         font-medium rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white
                   font-semibold rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Generando..." : "Aprobar y generar link"}
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-600">{error}</span>
      )}
    </span>
  );
}
