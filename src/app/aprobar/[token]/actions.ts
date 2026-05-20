"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendWhatsApp, buildMsgResultadoSolicitud } from "@/lib/wa";

export async function resolverSolicitudToken(
  prevState: any,
  formData: FormData
) {
  const token       = formData.get("token") as string;
  const solicitudId = formData.get("solicitud_id") as string;
  const accion      = formData.get("accion") as "aprobada" | "rechazada";
  const comentario  = (formData.get("comentario") as string)?.trim() || null;

  if (!token || !solicitudId || !accion) {
    return { error: "Datos invalidos." };
  }

  if (accion === "rechazada" && !comentario) {
    return { error: "Debes indicar el motivo del rechazo." };
  }

  const supabase = createAdminClient();

  // Verify token matches solicitud and is still pending
  const { data: sol } = await supabase
    .from("solicitudes")
    .select(`
      id, estado, token_aprobacion, motivo, costo_estimado,
      solicitante_id,
      profiles!solicitante_id(nombre_completo, telefono)
    `)
    .eq("id", solicitudId)
    .eq("token_aprobacion", token)
    .single();

  if (!sol) {
    return { error: "Link invalido o expirado." };
  }
  if (sol.estado !== "pendiente") {
    return { error: "Esta solicitud ya fue procesada anteriormente." };
  }

  const { error: updateErr } = await supabase
    .from("solicitudes")
    .update({
      estado: accion,
      comentario_aprobador: comentario,
    })
    .eq("id", solicitudId)
    .eq("token_aprobacion", token);

  if (updateErr) {
    return { error: "Error al procesar: " + updateErr.message };
  }

  // Notificar al solicitante via WhatsApp
  try {
    const solicitanteProfile = (sol as any).profiles;
    const telefono: string | undefined = solicitanteProfile?.telefono;
    const nombre: string = solicitanteProfile?.nombre_completo ?? "Empleado";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagina-de-compras-para-jpintuexpres.vercel.app";

    const msg = buildMsgResultadoSolicitud({
      solicitante: nombre,
      motivo: (sol as any).motivo,
      monto: (sol as any).costo_estimado,
      estado: accion,
      comentario: comentario ?? undefined,
      appLink: `${siteUrl}/solicitudes`,
    });

    // "to" = telefono del solicitante (si no hay, el servidor usara TEST_NUMBER en modo prueba)
    await sendWhatsApp({ to: telefono, message: msg });
  } catch (waErr) {
    console.warn("[WA] No se pudo notificar al solicitante:", waErr);
  }

  redirect(`/aprobar/${token}?done=1`);
}
