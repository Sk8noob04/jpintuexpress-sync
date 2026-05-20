"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import SolicitudesClient from "./SolicitudesClient";

type Tab = "inicio" | "historial";

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  aprobada:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rechazada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ESTADO_STRIPE: Record<string, string> = {
  pendiente: "border-l-yellow-400",
  aprobada:  "border-l-green-500",
  rechazada: "border-l-red-400",
};

interface Solicitud {
  id: string;
  motivo: string;
  costo_estimado: number;
  estado: "pendiente" | "aprobada" | "rechazada";
  fecha_limite?: string;
  created_at: string;
  proveedor?: string;
  placa?: string;
  lineas?: { nombre: string };
  prioridades?: { nombre: string };
}

interface Props {
  solicitudes: Solicitud[];
  nombre: string;
  success?: string;
  error?: string;
}

export default function SolicitudesHome({ solicitudes, nombre, success, error }: Props) {
  const [tab, setTab] = useState<Tab>("inicio");

  const stats = useMemo(() => ({
    total:     solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    aprobada:  solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
  }), [solicitudes]);

  const recientes = solicitudes.slice(0, 5);
  const primerNombre = nombre.split(" ")[0];
  const gastoTotal = solicitudes
    .filter(s => s.estado === "aprobada")
    .reduce((sum, s) => sum + (s.costo_estimado ?? 0), 0);

  return (
    <div className="space-y-4">

      {/* ── Tab switcher ──────────────────────────────────────────── */}
      <div className="glass-card p-1.5 flex gap-1">
        {(["inicio", "historial"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all capitalize
              ${tab === t
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}>
            {t === "inicio" ? "Inicio" : "Historial"}
          </button>
        ))}
      </div>

      {/* ── TAB: INICIO ──────────────────────────────────────────── */}
      {tab === "inicio" && (
        <div className="space-y-4">

          {/* Greeting + CTA */}
          <div className="glass-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
                {primerNombre[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Bienvenido de vuelta</p>
                <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">
                  {primerNombre} 👋
                </p>
              </div>
            </div>
            <Link href="/solicitudes/nueva"
              className="shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700
                         text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nueva
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.total}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Total</p>
            </div>
            <div className="glass-card p-4 text-center border-l-4 border-l-yellow-400 dark:border-l-yellow-500">
              <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{stats.pendiente}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Pendientes</p>
            </div>
            <div className="glass-card p-4 text-center border-l-4 border-l-green-500 dark:border-l-green-400">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.aprobada}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Aprobadas</p>
            </div>
            <div className="glass-card p-4 text-center border-l-4 border-l-red-400 dark:border-l-red-500">
              <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.rechazada}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Rechazadas</p>
            </div>
          </div>

          {/* Gasto aprobado */}
          {gastoTotal > 0 && (
            <div className="glass-card p-4 flex items-center justify-between border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">Gasto total aprobado</p>
                <p className="text-xl font-black text-blue-700 dark:text-blue-400">{formatCurrency(gastoTotal)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xl">
                💰
              </div>
            </div>
          )}

          {/* Últimas solicitudes */}
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Últimas solicitudes</h3>
              <button onClick={() => setTab("historial")}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Ver todas →
              </button>
            </div>

            {recientes.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <p className="text-3xl mb-2">🛒</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">No tienes solicitudes aún</p>
                <Link href="/solicitudes/nueva"
                  className="mt-3 inline-block text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Crear primera solicitud →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recientes.map((s) => (
                  <Link key={s.id} href={`/solicitudes/${s.id}`}
                    className={`block solicitud-card rounded-2xl border border-l-4 ${ESTADO_STRIPE[s.estado]} p-4 active:scale-[0.98] transition-[transform,box-shadow,background-color,border-color]`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ESTADO_BADGE[s.estado]}`}>
                            {s.estado}
                          </span>
                          {s.prioridades?.nombre && (
                            <span className="text-xs text-gray-500 font-medium">{s.prioridades.nombre}</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{s.motivo}</p>
                        {s.placa && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{s.placa}</p>
                        )}
                        {s.proveedor && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Proveedor: {s.proveedor}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(s.costo_estimado)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}

                {solicitudes.length > 5 && (
                  <button onClick={() => setTab("historial")}
                    className="w-full py-3 glass-card text-xs font-semibold text-blue-600 dark:text-blue-400 hover:shadow-md transition rounded-2xl">
                    Ver {solicitudes.length - 5} más →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ───────────────────────────────────────── */}
      {tab === "historial" && (
        <div>
          {success && (
            <div className="mb-3 p-3 bg-green-50/80 border border-green-200 rounded-xl text-sm text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-3 p-3 bg-red-50/80 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <SolicitudesClient solicitudes={solicitudes} />
        </div>
      )}
  </div>
  );
}
