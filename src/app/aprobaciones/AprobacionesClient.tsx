"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { exportarXLSX } from "@/lib/exportarExcel";

type Estado = "pendiente" | "aprobada" | "rechazada";
type FiltroVal = Estado | "todas" | "Alta" | "Media" | "Baja";

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  aprobada:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rechazada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  "bg-red-100 text-red-700",
  Media: "bg-orange-100 text-orange-700",
  Baja:  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const FILTROS: { label: string; value: FiltroVal; activeClass: string }[] = [
  { label: "Todas",      value: "todas",     activeClass: "bg-blue-600 text-white"   },
  { label: "Pendientes", value: "pendiente", activeClass: "bg-yellow-500 text-white" },
  { label: "Aprobadas",  value: "aprobada",  activeClass: "bg-green-600 text-white"  },
  { label: "Rechazadas", value: "rechazada", activeClass: "bg-red-600 text-white"    },
  { label: "Alta",       value: "Alta",      activeClass: "bg-red-700 text-white"    },
  { label: "Media",      value: "Media",     activeClass: "bg-orange-500 text-white" },
  { label: "Baja",       value: "Baja",      activeClass: "bg-gray-500 text-white"   },
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
  profiles?: { nombre_completo: string };
}

interface Props {
  solicitudes: Solicitud[];
  success?: string;
  error?: string;
}

function isUrgente(s: Solicitud) {
  return s.fecha_limite &&
    new Date(s.fecha_limite) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
}

function labelDia(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  const hoy   = new Date();
  const ayer  = new Date(); ayer.setDate(hoy.getDate() - 1);
  const fmt = (d: Date) => d.toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "long" });
  if (fecha.toDateString() === hoy.toDateString())  return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fmt(fecha).replace(/^\w/, c => c.toUpperCase());
}

function diaKey(fechaISO: string) {
  return fechaISO.slice(0, 10);
}

export default function AprobacionesClient({ solicitudes, success, error }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros]   = useState<Set<FiltroVal>>(new Set(["todas"]));
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  function toggleFiltro(valor: FiltroVal) {
    setFiltros(prev => {
      const next = new Set(prev);
      if (valor === "todas") return new Set(["todas"]);
      next.delete("todas");
      if (next.has(valor)) { next.delete(valor); if (next.size === 0) return new Set(["todas"]); }
      else next.add(valor);
      return next;
    });
  }

  function limpiarFechas() {
    setFechaDesde("");
    setFechaHasta("");
  }

  const counts = useMemo(() => ({
    todas:     solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    aprobada:  solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
    Alta:      solicitudes.filter(s => s.prioridades?.nombre === "Alta").length,
    Media:     solicitudes.filter(s => s.prioridades?.nombre === "Media").length,
    Baja:      solicitudes.filter(s => s.prioridades?.nombre === "Baja").length,
  }), [solicitudes]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const estadoFiltros = (["pendiente","aprobada","rechazada"] as FiltroVal[]).filter(v => filtros.has(v));
    const prioFiltros   = (["Alta","Media","Baja"] as FiltroVal[]).filter(v => filtros.has(v));
    const todasActivo   = filtros.has("todas");
    const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;

    return solicitudes.filter(s => {
      const soloEstado = estadoFiltros.length > 0 && prioFiltros.length === 0;
      const soloPrio   = prioFiltros.length > 0 && estadoFiltros.length === 0;
      const ambos      = estadoFiltros.length > 0 && prioFiltros.length > 0;

      let ok = todasActivo;
      if (soloEstado) ok = estadoFiltros.includes(s.estado);
      if (soloPrio)   ok = prioFiltros.includes((s.prioridades?.nombre ?? "") as FiltroVal);
      if (ambos)      ok = estadoFiltros.includes(s.estado) || prioFiltros.includes((s.prioridades?.nombre ?? "") as FiltroVal);
      if (!ok) return false;

      const fecha = new Date(s.created_at);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      if (!q) return true;
      return (
        s.motivo.toLowerCase().includes(q) ||
        s.profiles?.nombre_completo?.toLowerCase().includes(q) ||
        s.lineas?.nombre?.toLowerCase().includes(q) ||
        s.proveedor?.toLowerCase().includes(q) ||
        s.placa?.toLowerCase().includes(q)
      );
    });
  }, [solicitudes, filtros, busqueda, fechaDesde, fechaHasta]);

  const porDia = useMemo(() => {
    const mapa: Record<string, Solicitud[]> = {};
    for (const s of filtradas) {
      const k = diaKey(s.created_at);
      if (!mapa[k]) mapa[k] = [];
      mapa[k].push(s);
    }
    return Object.entries(mapa)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dia, items]) => ({ dia, label: labelDia(items[0].created_at), items }));
  }, [filtradas]);

  function handleExportar() {
    const fecha = new Date().toLocaleDateString("es-PA").replace(/\//g, "-");
    const filas = filtradas.map(s => ({
      "Solicitante":  s.profiles?.nombre_completo ?? "",
      "Motivo":       s.motivo,
      "Linea":        s.lineas?.nombre ?? "",
      "Prioridad":    s.prioridades?.nombre ?? "",
      "Estado":       s.estado,
      "Costo":        s.costo_estimado,
      "Placa":        s.placa ?? "",
      "Proveedor":    s.proveedor ?? "",
      "Fecha limite": s.fecha_limite ? formatDate(s.fecha_limite) : "",
      "Fecha envio":  formatDateTime(s.created_at),
    }));
    exportarXLSX(filas, `Aprobaciones_JPintuexpress_${fecha}`);
  }

  const hayFiltroFecha = fechaDesde || fechaHasta;

  return (
    <div>
      {success && (
        <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar por motivo, solicitante, linea..."
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

      <div className="flex gap-2 flex-wrap items-center justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => {
            const activo = filtros.has(f.value);
            const n = (counts as Record<string, number>)[f.value] ?? 0;
            return (
              <button key={f.value} onClick={() => toggleFiltro(f.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activo ? f.activeClass : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                {f.label}
                <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs px-1 ${activo ? "bg-white/25" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={handleExportar} disabled={filtradas.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Exportar Excel
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Rango de fechas:</span>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          className="px-3 py-1.5 glass-input text-sm text-gray-700 dark:text-gray-300"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">hasta</span>
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          className="px-3 py-1.5 glass-input text-sm text-gray-700 dark:text-gray-300"
        />
        {hayFiltroFecha && (
          <button onClick={limpiarFechas}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            Limpiar fechas
          </button>
        )}
        {(filtradas.length !== solicitudes.length) && (
          <span className="text-xs text-gray-400 ml-auto">
            Mostrando {filtradas.length} de {solicitudes.length}
          </span>
        )}
      </div>

      {filtradas.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">&#128269;</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Sin resultados</p>
          <p className="text-sm text-gray-400 mt-1">
            {busqueda ? `Sin resultados para "${busqueda}"` : "No hay solicitudes con ese filtro."}
          </p>
          {(busqueda || !filtros.has("todas") || hayFiltroFecha) && (
            <button onClick={() => { setBusqueda(""); setFiltros(new Set(["todas"])); limpiarFechas(); }}
              className="mt-3 text-xs text-blue-600 hover:underline">
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {porDia.map(({ dia, label, items }) => (
            <div key={dia}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2.5">
                {items.map(s => (
                  <Link key={s.id} href={`/aprobaciones/${s.id}`}
                    className={`block solicitud-card rounded-2xl border border-l-4 p-4 active:scale-[0.99] transition-[transform,box-shadow,background-color,border-color] ${
                        s.estado === "pendiente"
                          ? isUrgente(s)
                            ? "border-l-orange-400 dark:border-l-orange-400/80"
                            : "border-l-blue-500 dark:border-l-blue-400/80"
                          : s.estado === "aprobada"
                            ? "border-l-green-500 dark:border-l-green-400/80 opacity-75"
                            : "border-l-red-400 dark:border-l-red-400/80 opacity-75"
                      }`}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                            {s.estado}
                          </span>
                          {s.prioridades?.nombre && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORIDAD_COLOR[s.prioridades.nombre] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                              {s.prioridades.nombre === "Alta" ? "🔴" : s.prioridades.nombre === "Media" ? "🟡" : "🟢"} {s.prioridades.nombre}
                            </span>
                          )}
                          {s.estado === "pendiente" && isUrgente(s) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              &#9889; Urgente
                            </span>
                          )}
                        </div>
                        <p className={`font-black tabular-nums shrink-0 ${s.estado === "pendiente" ? "text-lg text-gray-900 dark:text-gray-100" : "text-base text-gray-600 dark:text-gray-500"}`}>
                          {formatCurrency(s.costo_estimado)}
                        </p>
                      </div>

                      <p className={`font-semibold leading-snug mb-1 ${s.estado === "pendiente" ? "text-gray-900 dark:text-gray-100 text-base" : "text-gray-700 dark:text-gray-300 text-sm"}`}>
                        {s.motivo}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {s.profiles?.nombre_completo}
                        {s.lineas?.nombre && <> &middot; {s.lineas.nombre}</>}
                        {s.placa && <> &middot; <span className="font-mono">{s.placa}</span></>}
                      </p>
                      {s.proveedor && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Proveedor: {s.proveedor}</p>
                      )}
                      {s.fecha_limite && (
                        <p className={`text-xs mt-1 font-medium ${isUrgente(s) ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}`}>
                          {isUrgente(s) ? "⚡ " : "📅 "}Limite: {formatDate(s.fecha_limite)}
                        </p>
                      )}

                      {s.estado === "pendiente" && (
                        <div className="mt-3.5 flex items-center justify-end">
                          <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                            Revisar
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
