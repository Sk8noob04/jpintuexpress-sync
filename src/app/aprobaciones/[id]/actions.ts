"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendWhatsApp, buildMsgResultadoSolicitud } from "@/lib/wa";

async function actualizarSolicitud(
  id: string,
  accion: "aprobada" | "rechazada",
  comentario: string | null,
  aprobadorId: string
) {
  const adminClient = createAdminClient();

  // Fetch solicitud details before updating (for WA notification)
  const { data: sol } = await adminClient
    .from("solicitudes")
    .select(`id, motivo, costo_estimado, estado, solicitante_id, profiles!solicitante_id(nombre_completo, telefono)`)
    .eq("id", id)
    .eq("estado", "pendiente")
    .single();

  const { error } = await adminClient
    .from("solicitudes")
    .update({
      estado: accion,
      aprobador_id: aprobadorId,
      comentario_aprobador: comentario || null,
    })
    .eq("id", id)
    .eq("estado", "pendiente");

  if (error) {
    const msg = encodeURIComponent("Error al procesar: " + error.message);
    redirect(`/aprobaciones/${id}?error=${msg}`);
  }

  // Notify solicitante via WhatsApp (best-effort)
  if (sol) {
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

      await sendWhatsApp({ to: telefono, message: msg });
    } catch (waErr) {
      console.warn("[WA] No se pudo notificar al solicitante:", waErr);
    }
  }

  revalidatePath("/aprobaciones");
  revalidatePath("/solicitudes");
  revalidatePath(`/aprobaciones/${id}`);
  redirect(`/aprobaciones?success=Solicitud+${accion}+correctamente`);
}

async function verificarAprobador() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "aprobador") redirect("/dashboard");
  return user;
}

export async function aprobarSolicitud(formData: FormData) {
  const user = await verificarAprobador();
  const id = formData.get("id") as string;
  const comentario = formData.get("comentario") as string;
  if (!id) redirect("/aprobaciones");
  await actualizarSolicitud(id, "aprobada", comentario, user.id);
}

export async function rechazarSolicitud(formData: FormData) {
  const user = await verificarAprobador();
  const id = formData.get("id") as string;
  const comentario = formData.get("comentario") as string;
  if (!id) redirect("/aprobaciones");
  await actualizarSolicitud(id, "rechazada", comentario, user.id);
}
