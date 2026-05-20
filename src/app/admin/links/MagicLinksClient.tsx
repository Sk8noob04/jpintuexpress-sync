"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

interface Solicitud {
  id: string;
  motivo: string;
  costo_estimado: number;
  proveedor?: string;
  fecha_limite?: string;
  created_at: string;
  token_aprobacion: string;
  prioridades?: { nombre: string };
  profiles?: { nombre_completo: string };
}

interface Props { solicitudes: Solicitud[]; }

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  Media: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  Baja:  "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400",
};

export default function MagicLinksClient({ solicitudes }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  function getLink(token: string) {
    return `${window.location.origin}/aprobar/${token}`;
  }

  async function copiarLink(token: string) {
    const url = getLink(token);
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2500);
  }

  async function copiarMensajeWA(s: Solicitud) {
    const url = getLink(s.token_aprobacion);
    const prioEmoji: Record<string, string> = { Alta: "🔴", Media: "🟠", Baja: "🟢" };
    const prio = s.prioridades?.nombre;
    const msg = [
      `📦 *Nueva solicitud de compra*`,
      `👤 ${s.profiles?.nombre_completo ?? "Empleado"}`,
      `🔧 ${s.motivo}`,
      s.proveedor ? `🏪 Proveedor: ${s.proveedor}` : "",
      `💰 *${formatCurrency(s.costo_estimado)}*`,
      prio ? `${prioEmoji[prio] ?? "⚡"} Prioridad: *${prio}*` : "",
      s.fecha_limite ? `⏰ Vence: ${formatDate(s.fecha_limite)}` : "",
      ``,
      `👇 Toca para aprobar o rechazar:`,
      url,
    ].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(msg);
    setCopied("wa-" + s.id);
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""} pendiente{solicitudes.length !== 1 ? "s" : ""} — genera links directos para aprobar sin iniciar sesión.
      </p>

      {solicitudes.map(s => (
        <div key={s.id} className="solicitud-card rounded-2xl border border-gray-100 overflow-hidden">

          {/* Header strip */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {s.prioridades?.nombre && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORIDAD_COLOR[s.prioridades.nombre] ?? "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400"}`}>
                      {s.prioridades.nombre}
                    </span>
                  )}
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                    Pendiente
                  </span>
                  {s.fecha_limite && (
                    <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                      ⏰ Vence {formatDate(s.fecha_limite)}
                    </span>
                  )}
                </div>
                {/* Motivo */}
                <p className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug">{s.motivo}</p>
              </div>
              {/* Monto */}
              <div className="text-right shrink-0">
                <p className="font-black text-gray-900 dark:text-gray-100 text-lg leading-none">{formatCurrency(s.costo_estimado)}</p>
              </div>
            </div>
          </div>

          {/* Details row */}
          <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/[0.06]">
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Solicitante: </span>
              {s.profiles?.nombre_completo ?? "—"}
            </span>
            {s.proveedor && (
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">Proveedor: </span>
                {s.proveedor}
              </span>
            )}
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">Creada: </span>
              {formatDate(s.created_at)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="px-4 py-3 flex gap-2 flex-wrap">

            {/* Copy link */}
            <button
              onClick={() => copiarLink(s.token_aprobacion)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition border
                ${copied === s.token_aprobacion
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/40 text-green-700 dark:text-green-400"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
                }`}>
              {copied === s.token_aprobacion ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar link
                </>
              )}
            </button>

            {/* Copy WA message */}
            <button
              onClick={() => copiarMensajeWA(s)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition border
                ${copied === "wa-" + s.id
                  ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/40 text-green-700 dark:text-green-400"
                  : "bg-green-600 hover:bg-green-700 border-green-600 dark:border-green-700 text-white"
                }`}>
              {copied === "wa-" + s.id ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Mensaje copiado
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Mensaje WA
                </>
              )}
            </button>

            {/* Open link */}
            <a href={`/aprobar/${s.token_aprobacion}`} target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border
                         bg-white dark:bg-white/5 border-gray-200 dark:border-white/10
                         text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
