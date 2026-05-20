"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

/* ── Tipos ──────────────────────────────────────────────────────────────────── */
interface Solicitud {
  id: string;
  motivo: string;
  costo_estimado: number;
  estado: string;
  created_at: string;
  updated_at: string;
  comentario_aprobador?: string | null;
  proveedor?: string | null;
  placa?: string | null;
  lineas?: { nombre: string } | null;
  prioridades?: { nombre: string } | null;
  solicitante?: { nombre_completo: string } | null;
  aprobador?: { nombre_completo: string } | null;
}

type TipoAccion = "creada" | "aprobada" | "rechazada";

interface Evento {
  key: string;
  solicitudId: string;
  tipo: TipoAccion;
  fecha: string;
  motivo: string;
  costo: number;
  actor: string;         // nombre de quien hizo la acción
  actorRole: string;     // "Solicitante" | "Aprobador"
  detalle?: string | null;
  placa?: string | null;
  proveedor?: string | null;
  linea?: string | null;
  prioridad?: string | null;
}

/* ── Estilos por tipo ───────────────────────────────────────────────────────── */
const TIPO_BADGE: Record<TipoAccion, string> = {
  creada:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  aprobada: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rechazada:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};
const TIPO_DOT: Record<TipoAccion, string> = {
  creada:   "bg-blue-500",
  aprobada: "bg-emerald-500",
  rechazada:"bg-red-500",
};
const TIPO_LABEL: Record<TipoAccion, string> = {
  creada:   "Creada",
  aprobada: "Aprobada",
  rechazada:"Rechazada",
};
const TIPO_ICON: Record<TipoAccion, string> = {
  creada:   "📝",
  aprobada: "✅",
  rechazada:"❌",
};

const ACCION_OPTIONS = [
  { label: "Todas las acciones", value: "" },
  { label: "📝 Creada",          value: "creada"    },
  { label: "✅ Aprobada",        value: "aprobada"  },
  { label: "❌ Rechazada",       value: "rechazada" },
];

/* ── Componente ─────────────────────────────────────────────────────────────── */
export default function HistorialClient({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [busqueda,    setBusqueda]    = useState("");
  const [tipoFiltro,  setTipo]        = useState("");
  const [fechaDesde,  setFechaDesde]  = useState("");
  const [fechaHasta,  setFechaHasta]  = useState("");
  const [usuarioFiltro, setUsuario]   = useState("");

  /* ── Convertir solicitudes en eventos separados ── */
  const eventos = useMemo<Evento[]>(() => {
    const list: Evento[] = [];

    for (const s of solicitudes) {
      const base = {
        solicitudId: s.id,
        motivo:      s.motivo,
        costo:       s.costo_estimado,
        placa:       s.placa,
        proveedor:   s.proveedor,
        linea:       s.lineas?.nombre ?? null,
        prioridad:   s.prioridades?.nombre ?? null,
      };

      // Evento 1: creación
      list.push({
        ...base,
        key:      `${s.id}-creada`,
        tipo:     "creada",
        fecha:    s.created_at,
        actor:    s.solicitante?.nombre_completo ?? "Solicitante desconocido",
        actorRole:"Solicitante",
      });

      // Evento 2: resolución (solo si ya no está pendiente)
      if (s.estado === "aprobada" || s.estado === "rechazada") {
        list.push({
          ...base,
          key:      `${s.id}-resolucion`,
          tipo:     s.estado as TipoAccion,
          fecha:    s.updated_at,
          actor:    s.aprobador?.nombre_completo ?? "Aprobador (link WA)",
          actorRole:"Aprobador",
          detalle:  s.comentario_aprobador,
        });
      }
    }

    // Ordenar por fecha descendente
    list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return list;
  }, [solicitudes]);

  /* ── Usuarios únicos para el dropdown ── */
  const usuariosUnicos = useMemo(() => {
    const set = new Set<string>();
    for (const ev of eventos) {
      if (ev.actor) set.add(ev.actor);
    }
    return Array.from(set).sort();
  }, [eventos]);

  /* ── Filtros ── */
  const resultado = useMemo(() => {
    const q     = busqueda.toLowerCase().trim();
    const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const hasta  = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;

    return eventos.filter(ev => {
      if (tipoFiltro && ev.tipo !== tipoFiltro) return false;
      if (usuarioFiltro && ev.actor !== usuarioFiltro) return false;
      const fecha = new Date(ev.fecha);
      if (desde && fecha < desde) return false;
      if (hasta  && fecha > hasta)  return false;
      if (!q) return true;
      return (
        ev.actor.toLowerCase().includes(q)       ||
        ev.motivo.toLowerCase().includes(q)      ||
        (ev.placa ?? "").toLowerCase().includes(q)     ||
        (ev.proveedor ?? "").toLowerCase().includes(q) ||
        (ev.detalle ?? "").toLowerCase().includes(q)
      );
    });
  }, [eventos, busqueda, tipoFiltro, usuarioFiltro, fechaDesde, fechaHasta]);

  const hayFiltros = busqueda || tipoFiltro || fechaDesde || fechaHasta || usuarioFiltro;
  function limpiar() { setBusqueda(""); setTipo(""); setFechaDesde(""); setFechaHasta(""); setUsuario(""); }

  return (
    <div className="space-y-4">

      {/* ── Filtros ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, motivo, placa, proveedor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200
                       dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select value={tipoFiltro} onChange={e => setTipo(e.target.value)}
            className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 transition">
            {ACCION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={usuarioFiltro} onChange={e => setUsuario(e.target.value)}
            className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 transition">
            <option value="">Todos los usuarios</option>
            {usuariosUnicos.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          <span className="text-xs text-gray-400 hidden sm:block">|</span>
          <span className="text-xs font-medium text-gray-500">Desde</span>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
            className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 transition" />
          <span className="text-xs text-gray-400">hasta</span>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
            className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 transition" />

          {hayFiltros && (
            <button onClick={limpiar}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap">
              Limpiar filtros
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
            {resultado.length} de {eventos.length} evento{eventos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Timeline ── */}
      {resultado.length === 0 ? (
        <div className="glass-card p-10 text-center text-gray-400 text-sm">
          {hayFiltros ? "Sin eventos con ese filtro." : "Sin actividad todavía."}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {resultado.map(ev => (
              <a key={ev.key} href={`/admin/solicitudes/${ev.solicitudId}`}
                className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition">

                {/* Icono */}
                <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base mt-0.5"
                  style={{ background: ev.tipo === "creada"
                    ? "rgba(59,130,246,0.12)"
                    : ev.tipo === "aprobada"
                      ? "rgba(16,185,129,0.12)"
                      : "rgba(239,68,68,0.12)" }}>
                  {TIPO_ICON[ev.tipo]}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {/* Primera línea: badge + motivo */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold capitalize
                      ${TIPO_BADGE[ev.tipo]}`}>
                      {TIPO_LABEL[ev.tipo]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {ev.motivo}
                    </span>
                  </div>

                  {/* Segunda línea: actor */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{ev.actor}</span>
                    <span className="text-gray-400"> · {ev.actorRole}</span>
                  </p>

                  {/* Detalles adicionales */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {ev.linea && <span className="text-xs text-gray-400">{ev.linea}</span>}
                    {ev.prioridad && <span className="text-xs text-gray-400">{ev.prioridad}</span>}
                    {ev.placa && <span className="text-xs text-gray-400 font-mon