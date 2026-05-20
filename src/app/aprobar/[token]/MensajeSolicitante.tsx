"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  estado: "aprobada" | "rechazada";
  motivo: string;
  proveedor?: string;
  placa?: string;
  prioridad?: string;
  costo: number;
  comentario?: string;
  solicitudId: string;
}

export default function MensajeSolicitante({
  estado, motivo, proveedor, placa, prioridad, costo, comentario, solicitudId,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  // Link para el solicitante: va a /solicitudes (lista) para evitar error de auth redirect
  const appLink = `${siteUrl}/solicitudes`;

  // Link de reenvio rapido — incluido SOLO en el texto del mensaje para el solicitante
  const reenvioParams = new URLSearchParams({
    motivo:    motivo,
    placa:     placa ?? "",
    proveedor: proveedor ?? "",
  }).toString();
  const reenvioLink = `${siteUrl}/solicitudes/nueva?${reenvioParams}`;

  const aprobadaLines = [
    "\u2705 *Tu solicitud fue APROBADA*",
    "",
    `Motivo: ${motivo}`,
    `Monto: ${formatCurrency(costo)}`,
    prioridad  ? `Prioridad: ${prioridad}`     : "",
    comentario ? `Comentario: ${comentario}`   : "",
    "",
    "Ver tus solicitudes:",
    appLink,
  ].filter(Boolean).join("\n");

  const rechazadaLines = [
    "\u274C *Tu solicitud fue RECHAZADA*",
    "",
    `Motivo: ${motivo}`,
    `Monto: ${formatCurrency(costo)}`,
    prioridad  ? `Prioridad: ${prioridad}`           : "",
    comentario ? `Razon del rechazo: *${comentario}*` : "",
    "",
    "Ver tus solicitudes:",
    appLink,
    "",
    "\uD83D\uDD04 Para corregir y reenviar rapidamente:",
    reenvioLink,
  ].filter(Boolean).join("\n");

  const mensaje = estado === "aprobada" ? aprobadaLines : rechazadaLines;

  async function copiar() {
    await navigator.clipboard.writeText(mensaje);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className={`w-full max-w-lg mt-6 rounded-2xl border-2 p-5
      ${estado === "aprobada" ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
        Mensaje para enviar al solicitante por WhatsApp
      </p>

      <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white rounded-xl border
                      border-gray-200 p-3 mb-3 font-sans leading-relaxed break-all">
        {mensaje}
      </pre>

      <button onClick={copiar}
        className={`w-full py-2.5 font-semibold rounded-xl text-sm transition
          ${copied
            ? "bg-green-600 text-white"
            : estado === "aprobada"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
        {copied
          ? "Copiado — pega el mensaje en WhatsApp"
          : "Copiar mensaje para el solicitante"}
      </button>
    </div>
  );
}
