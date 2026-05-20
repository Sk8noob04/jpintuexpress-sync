"use client";

import { useState } from "react";
import { aprobarSolicitud, rechazarSolicitud } from "./actions";

interface AprobacionActionsProps {
  id: string;
}

export default function AprobacionActions({ id }: AprobacionActionsProps) {
  const [showComment, setShowComment] = useState(false);
  const [confirming, setConfirming] = useState<"aprobar" | "rechazar" | null>(null);

  return (
    <>
      {/* Spacer so content isn't hidden behind sticky bar */}
      <div className="h-28" />

      {/* Sticky decision bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/96 dark:bg-gray-900/96 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-4">
          <form className="space-y-2.5">
            <input type="hidden" name="id" value={id} />

            {showComment && (
              <textarea
                name="comentario"
                rows={2}
                placeholder="Escribe un comentario opcional para el solicitante..."
                autoFocus
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
              />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowComment(v => !v)}
                className="text-xs text-gray-400 hover:text-blue-500 transition shrink-0 underline underline-offset-2"
              >
                {showComment ? "− ocultar comentario" : "+ agregar comentario"}
              </button>

              <div className="flex gap-2.5 flex-1">
                <button
                  type="submit"
                  formAction={rechazarSolicitud}
                  className="flex-1 py-3.5 border-2 border-red-400 text-red-600 font-bold rounded-xl
                             text-sm hover:bg-red-50 active:scale-95 transition"
                >
                  ✕&nbsp; Rechazar
                </button>
                <button
                  type="submit"
                  formAction={aprobarSolicitud}
                  className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold
                             rounded-xl text-sm active:scale-95 transition shadow-md"
                >
                  ✓&nbsp; Aprobar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
