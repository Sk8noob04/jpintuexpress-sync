"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { exportarXLSX } from "@/lib/exportarExcel";

type Estado = "pendiente" | "aprobada" | "rechazada";
type SortCol = "fecha" | "monto" | "estado" | "prioridad" | null;
type SortDir = "asc" | "desc";

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobada:  "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  "bg-red-100 text-red-700",
  Media: "bg-orange-100 text-orange-700",
  Baja:  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const PRIORIDAD_ORDER: Record<string, number> = { Alta: 1, Media: 2, Baja: 3 };
const ESTADO_ORDER: Record<string, number>    = { pendiente: 1, aprobada: 2, rechazada: 3 };

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
  created_at: string;
  fecha_limite?: string;
  lineas?: { nombre: string };
  prioridades?: { nombre: string };
  profiles?: { nombre_completo: string };
}

interface Props {
  solicitudes: Solicitud[];
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return sortDir === "asc" ? (
    <svg className="w-3.5 h-3.5 text-blue-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-blue-500 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function AdminSolicitudesClient({ solicitudes }: Props) {
  const searchParams = useSearchParams();

  // Init filter from URL param — e.g. ?estado=pendiente
  const estadoParam = searchParams.get("estado") as Estado | "todas" | null;
  const initialFiltro: Estado | "todas" =
    estadoParam && ["pendiente", "aprobada", "rechazada"].includes(estadoParam)
      ? estadoParam
      : "todas";

  const [busqueda, setBusqueda]     = useState("");
  const [filtros, setFiltros]       = useState<Set<Estado | "todas">>(new Set([initialFiltro]));
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [sortCol, setSortCol]       = useState<SortCol>(null);
  const [sortDir, setSortDir]       = useState<SortDir>("asc");

  // If URL param changes (e.g. browser back/forward), sync the filter
  useEffect(() => {
    const p = searchParams.get("estado") as Estado | null;
    if (p && ["pendiente", "aprobada", "rechazada"].includes(p)) {
      setFiltros(new Set([p]));
    } else {
      setFiltros(new Set(["todas"]));
    }
  }, [searchParams]);

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

  function handleSort(col: SortCol) {
    setSortCol(prev => {
      if (prev === col) {
        if (sortDir === "asc") { setSortDir("desc"); return col; }
        setSortDir("asc"); return null;
      }
      setSortDir("asc");
      return col;
    });
  }

  const resultado = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;

    const filtered = solicitudes.filter(s => {
      const estadoOk = filtros.has("todas") || filtros.has(s.estado as Estado);
      if (!estadoOk) return false;
      const fecha = new Date(s.created_at);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      if (!q) return true;
      return (
        s.motivo.toLowerCase().includes(q) ||
        s.profiles?.nombre_completo?.toLowerCase().includes(q) ||
        s.lineas?.nombre?.toLowerCase().includes(q) ||
        s.prioridades?.nombre?.toLowerCase().includes(q)
      );
    });

    if (!sortCol) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "fecha") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortCol === "monto") {
        cmp = a.costo_estimado - b.costo_estimado;
      } else if (sortCol === "estado") {
        cmp = (ESTADO_ORDER[a.estado] ?? 9) - (ESTADO_ORDER[b.estado] ?? 9);
      } else if (sortCol === "prioridad") {
        cmp = (PRIORIDAD_ORDER[a.prioridades?.nombre ?? ""] ?? 9) -
              (PRIORIDAD_ORDER[b.prioridades?.nombre ?? ""] ?? 9);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [solicitudes, busqueda, filtros, fechaDesde, fechaHasta, sortCol, sortDir]);

  const counts = useMemo(() => ({
    todas:     solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    aprobada:  solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
  }), [solicitudes]);

  function handleExportar() {
    const fecha = new Date().toLocaleDateString("es-PA").replace(/\//g, "-");
    const filas = resultado.map(s => ({
      "Solicitante":   s.profiles?.nombre_completo ?? "",
      "Motivo":        s.motivo,
      "Linea":         s.lineas?.nombre ?? "",
      "Prioridad":     s.prioridades?.nombre ?? "",
      "Costo":         s.costo_estimado,
      "Estado":        s.estado,
      "Fecha limite":  s.fecha_limite ? formatDate(s.fecha_limite) : "",
      "Fecha envio":   formatDate(s.created_at),
    }));
    exportarXLSX(filas, `Solicitudes_JPintuexpress_${fecha}`);
  }

  const hayFiltroFecha = fechaDesde || fechaHasta;

  function ThCol({ col, label, className = "" }: { col: SortCol; label: string; className?: string }) {
    return (
      <th
        className={`px-4 py-3 font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition ${className}`}
        onClick={() => handleSort(col)}
      >
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: counts.todas,     color: "bg-gray-100/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300"    },
          { label: "Pendientes", value: counts.pendiente, color: "bg-yellow-100/70 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
          { label: "Aprobadas",  value: counts.aprobada,  color: "bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-400"   },
          { label: "Rechazadas", value: counts.rechazada, color: "bg-red-100/70 dark:bg-red-900/30 text-red-700 dark:text-red-400"       },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar por solicitante, motivo, linea..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
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

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map(f => {
            const activo = filtros.has(f.value);
            const count = counts[f.value === "todas" ? "todas" : f.value] ?? 0;
            return (
              <button key={f.value} onClick={() => toggleFiltro(f.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${activo ? f.value === "pendiente" ? "bg-yellow-500 text-white" : f.value === "aprobada" ? "bg-green-600 text-white" : f.value === "rechazada" ? "bg-red-600 text-white" : "bg-blue-600 text-white" : "bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"}`}>
                {f.label}
                <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs px-1 ${activo ? "bg-white/25" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          {resultado.length !== solicitudes.length && (
            <span className="text-xs text-gray-400 self-center ml-1">
              Mostrando {resultado.length} de {solicitudes.length}
            </span>
          )}
        </div>
        <button onClick={handleExportar} disabled={resultado.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Exportar Excel
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Rango de fechas:</span>
        <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
          className="px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">hasta</span>
        <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
          className="px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        {hayFiltroFecha && (
          <button onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap">
            Limpiar
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Solicitante</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Motivo</th>
              <ThCol col="prioridad" label="Prioridad" className="text-left" />
              <ThCol col="monto"     label="Costo"     className="text-right" />
              <ThCol col="estado"    label="Estado"    className="text-center" />
              <ThCol col="fecha"     label="Fecha envío" className="text-right" />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {resultado.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                  {busqueda ? `Sin resultados para "${busqueda}"` : "Sin solicitudes con ese filtro."}
                </td>
              </tr>
            ) : resultado.map(s => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-white/40 dark:hover:bg-gray-700/30 transition">
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{s.profiles?.nombre_completo}</td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="truncate text-gray-900 dark:text-gray-100">{s.motivo}</p>
                </td>
                <td className="px-4 py-3">
                  {s.prioridades?.nombre && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_COLOR[s.prioridades.nombre] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                      {s.prioridades.nombre}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {formatCurrency(s.costo_estimado)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDateTime(s.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/solicitudes/${s.id}`}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
