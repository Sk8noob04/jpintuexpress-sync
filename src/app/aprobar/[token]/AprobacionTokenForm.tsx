"use client";

import { useActionState, useState } from "react";
import { resolverSolicitudToken } from "./actions";

interface Props {
  solicitudId: string;
  token: string;
}

export default function AprobacionTokenForm({ solicitudId, token }: Props) {
  const [state, action, pending] = useActionState(resolverSolicitudToken, null);
  const [accion, setAccion] = useState<"aprobada" | "rechazada" | null>(null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="solicitud_id" value={solicitudId} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="accion" value={accion ?? ""} />

      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {state.error}
        </div>
      )}

      {/* Approve / Reject buttons */}
      {accion === null && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setAccion("aprobada")}
            className="py-4 bg-green-500/20 hover:bg-green-500/30 dark:bg-green-500/15 dark:hover:bg-green-500/25
                       border-2 border-green-500 dark:border-green-400
                       text-green-800 dark:text-green-300 font-black text-base
                       rounded-2xl transition active:scale-95 backdrop-blur-sm
                       flex flex-col items-center gap-1.5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            APROBAR
          </button>
          <button type="button" onClick={() => setAccion("rechazada")}
            className="py-4 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-500/15 dark:hover:bg-red-500/25
                       border-2 border-red-500 dark:border-red-400
                       text-red-800 dark:text-red-300 font-black text-base
                       rounded-2xl transition active:scale-95 backdrop-blur-sm
                       flex flex-col items-center gap-1.5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            RECHAZAR
          </button>
        </div>
      )}

      {/* Comment field (shown after selecting action) */}
      {accion !== null && (
        <div className={`p-4 rounded-2xl border-2 ${accion === "aprobada" ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20" : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"}`}>
          <p className="font-bold text-sm mb-3 text-gray-900 dark:text-gray-100">
            {accion === "aprobada" ? "✓ Aprobando solicitud" : "✕ Rechazando solicitud"}
          </p>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comentario {accion === "rechazada" ? <span className="text-red-500">(obligatorio)</span> : "(opcional)"}
          </label>
          <textarea
            name="comentario"
            rows={3}
            required={accion === "rechazada"}
            placeholder={accion === "rechazada" ? "Indica el motivo del rechazo..." : "Comentario adicional (opcional)..."}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800
                       text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setAccion(null)}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              Volver
            </button>
            <button type="submit" disabled={pending}
              className={`flex-1 py-2.5 font-bold rounded-xl text-sm text-white transition disabled:opacity-60
                ${accion === "aprobada" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {pending ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
