/**
 * Envia un mensaje de WhatsApp a traves del servidor local wa-server.
 * Si WA_SERVER_URL no esta configurado, falla silenciosamente.
 */
export async function sendWhatsApp(params: {
  to?: string;
  message: string;
}): Promise<void> {
  const serverUrl = process.env.WA_SERVER_URL;
  if (!serverUrl) return;

  const secret = process.env.WA_SECRET || "jpintuexpress2026";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${serverUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret": secret,
      },
      body: JSON.stringify({ to: params.to, message: params.message }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.text();
      console.warn("[WA] Error al enviar:", body);
    }
  } catch (err) {
    console.warn("[WA] No se pudo conectar al servidor WA:", (err as Error).message);
  }
}

/**
 * Construye el mensaje WA para notificar al aprobador de una nueva solicitud.
 */
export function buildMsgNuevaSolicitud(params: {
  solicitante: string;
  motivo: string;
  monto: number;
  placa?: string;
  prioridad?: string;
  linkAprobacion: string;
}): string {
  const prioEmoji: Record<string, string> = { Alta: "🔴", Media: "🟠", Baja: "🟢" };
  const prio = params.prioridad;
  const prioLine = prio ? `${prioEmoji[prio] ?? "⚡"} Prioridad: *${prio}*` : "";

  const lines = [
    "🛒 *Nueva solicitud de compra - JPintuexpress*",
    "",
    `👤 Solicitante: *${params.solicitante}*`,
    `📋 Motivo: ${params.motivo}`,
    `💰 Monto: *$${params.monto.toFixed(2)}*`,
    params.placa ? `🚗 Placa: ${params.placa}` : "",
    prioLine,
    "",
    "Para aprobar o rechazar:",
    params.linkAprobacion,
  ].filter(Boolean);

  return lines.join("\n");
}

/**
 * Construye el mensaje WA para notificar al solicitante del resultado.
 */
export function buildMsgResultadoSolicitud(params: {
  solicitante: string;
  motivo: string;
  monto: number;
  estado: "aprobada" | "rechazada";
  comentario?: string;
  appLink: string;
}): string {
  const aprobada = params.estado === "aprobada";
  const titulo = aprobada
    ? "✅ *Solicitud APROBADA - JPintuexpress*"
    : "❌ *Solicitud RECHAZADA - JPintuexpress*";

  const lines = [
    titulo,
    "",
    `Hola *${params.solicitante}*,`,
    `Tu solicitud fue ${aprobada ? "aprobada" : "rechazada"}.`,
    "",
    `📋 Motivo: ${params.motivo}`,
    `💰 Monto: $${params.monto.toFixed(2)}`,
    params.comentario ? `💬 Comentario: ${params.comentario}` : "",
    "",
    "Ver detalles en la app:",
    params.appLink,
  ].filter(Boolean);

  return lines.join("\n");
}
