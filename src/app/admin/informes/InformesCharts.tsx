"use client";

import { exportarXLSX, exportarXLSXMultiSheet } from "@/lib/exportarExcel";
import { formatCurrency } from "@/lib/utils";

interface Mes { label: string; aprobado: number; rechazado: number; pendiente: number; }
interface Linea { nombre: string; aprobado: number; total: number; }
interface SolExport {
  solicitante: string; motivo: string; linea: string;
  estado: string; costo: number; enviada: string;
}

interface Props {
  meses: Mes[];
  lineas: Linea[];
  exportData: SolExport[];
  /** When provided, generates a multi-sheet XLSX instead of single-sheet */
  exportSheets?: { nombre: string; filas: Record<string, any>[] }[];
  exportNombre?: string;
}

export default function InformesCharts({ meses, lineas, exportData, exportSheets, exportNombre }: Props) {
  const maxMes = Math.max(...meses.map(m => m.aprobado + m.rechazado + m.pendiente), 1);
  const maxLinea = Math.max(...lineas.map(l => l.aprobado), 1);

  function handleExportar() {
    const fecha = new Date().toLocaleDateString("es-PA").replace(/\//g, "-");
    const archivo = exportNombre ? `${exportNombre}_${fecha}` : `Informe_JPintuexpress_${fecha}`;

    if (exportSheets && exportSheets.length > 0) {
      exportarXLSXMultiSheet(exportSheets, archivo);
    } else {
      const filas = exportData.map(s => ({
        "Solicitante": s.solicitante,
        "Motivo":      s.motivo,
        "Linea":       s.linea,
        "Estado":      s.estado,
        "Costo (USD)": s.costo,
        "Fecha envio": s.enviada,
      }));
      exportarXLSX(filas, archivo);
    }
  }

  return (
    <div className="space-y-8 mb-10">
      {/* Export button */}
      <div className="flex justify-end">
        <button onClick={handleExportar} disabled={exportData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Exportar informe Excel
        </button>
      </div>

      {/* Monthly chart */}
      <div className="glass-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Gasto mensual (ultimos 6 meses)</h2>
        <p className="text-xs text-gray-400 mb-5">Solo solicitudes aprobadas</p>
        <div className="flex items-end gap-3 h-36">
          {meses.map(m => {
            const pct = maxMes > 0 ? Math.round(((m.aprobado) / maxMes) * 100) : 0;
            const pctTotal = maxMes > 0 ? Math.round(((m.aprobado + m.rechazado + m.pendiente) / maxMes) * 100) : 0;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  {m.aprobado > 0 ? formatCurrency(m.aprobado) : ""}
                </p>
                <div className="w-full relative flex flex-col justify-end" style={{ height: "80px" }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-100 rounded-t"
                    style={{ height: pctTotal > 0 ? `${pctTotal}%` : "4px" }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-green-400 rounded-t"
                    style={{ height: pct > 0 ? `${pct}%` : "0px" }} />
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">{m.label}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Aprobado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> Total solicitado</span>
        </div>
      </div>

      {/* By line chart */}
      {lineas.length > 0 && (
        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-base font-bold text-gray-900 mb-0.5">Gasto aprobado por linea</h2>
          <p className="text-xs text-gray-400 mb-5">Monto total de solicitudes aprobadas</p>
          <div className="space-y-3">
            {lineas.map(l => {
              const pct = maxLinea > 0 ? Math.round((l.aprobado / maxLinea) * 100) : 0;
              return (
                <div key={l.nombre} className="flex items-center gap-3">
                  <p className="text-sm text-gray-700 w-28 truncate shrink-0" title={l.nombre}>{l.nombre}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 w-20 text-right shrink-0">
                    {formatCurrency(l.aprobado)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
