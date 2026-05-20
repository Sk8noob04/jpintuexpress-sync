"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type Estado = "pendiente" | "aprobada" | "rechazada";

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

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  "bg-red-100 text-red-700",
  Media: "bg-orange-100 text-orange-700",
  Baja:  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const FILTROS: { label: string; value: Estado | "todas" }[] = [
  { label: "Todas",      value: "todas"     },
  { label: "Pendientes", value: "pendiente" },
  { label: "Aprobadas",  value: "aprobada"  },
  { label: "Rechazadas", value: "rechazada" },
];

interface Solicitud {
  id: string;
  motivo: string;
  costo_estimado: number;
  estado: Estado;
  fecha_limite?: string;
  created_at: string;
  proveedor?: string;
  placa?: string;
  lineas?: { nombre: string };
  prioridades?: { nombre: string };
}

interface Props {
  solicitudes: Solicitud[];
}

export default function SolicitudesClient({ solicitudes }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<Set<Estado | "todas">>(new Set(["todas"]));
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  function toggleFiltro(valor: Estado | "todas") {
    setFiltros(prev => {
      const next = new Set(prev);
      if (valor === "todas") return new Set(["todas"]);
      next.delete("todas");
      if (next.has(valor)) {
        next.delete(valor);
        if (next.size === 0) return new Set(["todas"]);
      } else {
        next.add(valor);
      }
      return next;
    });
  }

  const resultado = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;
    return solicitudes.filter(s => {
      const estadoOk = filtros.has("todas") || filtros.has(s.estado as Estado);
      if (!estadoOk) return false;
      const fecha = new Date(s.created_at);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      if (!q) return true;
      return (
        s.motivo.toLowerCase().includes(q) ||
        s.lineas?.nombre?.toLowerCase().includes(q) ||
        s.placa?.toLowerCase().includes(q) ||
        s.proveedor?.toLowerCase().includes(q) ||
        s.prioridades?.nombre?.toLowerCase().includes(q)
      );
    });
  }, [solicitudes, busqueda, filtros, fechaDesde, fechaHasta]);

  const counts = useMemo(() => ({
    todas:     solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    aprobada:  solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
  }), [solicitudes]);

  const hayFiltroFecha = fechaDesde || fechaHasta;

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar por motivo, linea, proveedor..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 glass-input text-sm"
        />
        {busqueda && (
          <button onClick={() => setBusqueda("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => {
          const activo = filtros.has(f.value);
          const count = counts[f.value === "todas" ? "todas" : f.value] ?? 0;
          return (
            <button key={f.value} onClick={() => toggleFiltro(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activo ? f.value === "pendiente" ? "bg-yellow-500 text-white" : f.value === "aprobada" ? "bg-green-600 text-white" : f.value === "rechazada" ? "bg-red-600 text-white" : "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}>
              {f.label}
              <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs px-1 ${activo ? "bg-white/25" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Rango de fechas:</span>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          className="px-3 py-1.5 glass-input text-sm text-gray-700 dark:text-gray-300"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">hasta</span>
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          className="px-3 py-1.5 glass-input text-sm text-gray-700 dark:text-gray-300"
        />
        {hayFiltroFecha && (
          <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            Limpiar
          </button>
        )}
        {resultado.length !== solicitudes.length && (
          <span className="text-xs text-gray-400 ml-auto">
            {resultado.length} de {solicitudes.length}
          </span>
        )}
      </div>

      {resultado.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-3xl mb-2">&#128269;</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {busqueda ? `Sin resultados para "${busqueda}"` : "No hay solicitudes con ese filtro."}
          </p>
          {(busqueda || !filtros.has("todas") || hayFiltroFecha) && (
            <button onClick={() => { setBusqueda(""); setFiltros(new Set(["todas"])); setFechaDesde(""); setFechaHasta(""); }}
              className="mt-3 text-xs text-blue-600 hover:underline">
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 px-1">
            {resultado.length} solicitud{resultado.length !== 1 ? "es" : ""}
            {busqueda && ` para "${busqueda}"`}
          </p>
          <div className="space-y-2">
            {resultado.map(s => (
              <Link key={s.id} href={`/solicitudes/${s.id}`}
                className={`block solicitud-card rounded-2xl border border-l-4 ${ESTADO_STRIPE[s.estado]} p-4 active:scale-[0.99] transition-[transform,box-shadow,background-color,border-color]`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                        {s.estado}
                      </span>
                      {s.prioridades?.nombre && (
                        <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_COLOR[s.prioridades.nombre] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                          {s.prioridades.nombre}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug">{s.motivo}</p>
                    {s.placa && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{s.placa}</p>
                    )}
                    {s.proveedor && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Proveedor: {s.proveedor}</p>
                    )}
                    {s.fecha_limite && (
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">Límite: {formatDate(s.fecha_limite)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formatCurrency(s.costo_estimado)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(s.created_at)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
  </div>
  );
}
