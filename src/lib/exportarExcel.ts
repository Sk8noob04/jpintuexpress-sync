"use client";
// NOTE: This file is a client-side module only.
// SheetJS (xlsx) is used for real .xlsx generation.
import * as XLSX from "xlsx";

/** Single-sheet XLSX download */
export function exportarXLSX(filas: Record<string, any>[], nombreArchivo: string) {
  if (filas.length === 0) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas);
  _autoWidth(ws, filas);
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}

/** Multi-sheet XLSX download */
export function exportarXLSXMultiSheet(
  sheets: { nombre: string; filas: Record<string, any>[] }[],
  nombreArchivo: string
) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    if (sheet.filas.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(sheet.filas);
    _autoWidth(ws, sheet.filas);
    XLSX.utils.book_append_sheet(wb, ws, sheet.nombre.slice(0, 31));
  }
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}

/** @deprecated Use exportarXLSX instead */
export const exportarCSV = exportarXLSX;

// Helper: auto-fit column widths
function _autoWidth(ws: XLSX.WorkSheet, filas: Record<string, any>[]) {
  if (!filas.length) return;
  const cols = Object.keys(filas[0]);
  const widths = cols.map(col => {
    const max = Math.max(col.length, ...filas.map(f => String(f[col] ?? "").length));
    return { wch: Math.min(max + 2, 50) };
  });
  ws["!cols"] = widths;
}
