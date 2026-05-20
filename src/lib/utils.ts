/**
 * Utilidades pequeñas de uso general.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea una fecha ISO en formato corto en español.
 * Ejemplo: "2026-05-07T..." -> "7 de mayo de 2026"
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formatea una fecha ISO con hora en zona horaria de Panama.
 * Ejemplo: "2026-05-07T20:00:00Z" -> "7 de mayo de 2026, 3:00 p. m."
 */
export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Panama",
  });
}
