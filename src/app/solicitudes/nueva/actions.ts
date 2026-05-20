"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { sendWhatsApp, buildMsgNuevaSolicitud } from "@/lib/wa";

export async function crearSolicitud(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const msg = encodeURIComponent("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
    redirect(`/login?error=${msg}&next=/solicitudes/nueva`);
  }

  const motivo       = (formData.get("motivo") as string)?.trim();
  const costoStr     = formData.get("costo_estimado") as string;
  const placa        = (formData.get("placa") as string)?.trim().toUpperCase() || null;
  const prioridad_id = formData.get("prioridad_id") as string | null;
  const fecha_limite = formData.get("fecha_limite") as string | null;
  const proveedor    = (formData.get("proveedor") as string)?.trim() || null;
  const imagenFile   = formData.get("imagen") as File | null;

  if (!motivo || !costoStr || !placa) {
    return { error: "Completa todos los campos requeridos" };
  }
  const costo_estimado = parseFloat(costoStr);
  if (isNaN(costo_estimado) || costo_estimado < 0) {
    return { error: "El costo debe ser un numero valido mayor a 0" };
  }

  let imagen_url: string | null = null;

  if (imagenFile && imagenFile.size > 0) {
    const ext  = imagenFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("solicitudes-imagenes")
      .upload(path, imagenFile, { contentType: imagenFile.type });

    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage
        .from("solicitudes-imagenes")
        .getPublicUrl(uploadData.path);
      imagen_url = urlData.publicUrl;
    }
  }

  const { data: inserted, error } = await supabase.from("solicitudes").insert({
    solicitante_id: user.id,
    motivo,
    costo_estimado,
    placa,
    prioridad_id:  prioridad_id  || null,
    fecha_limite:  fecha_limite  || null,
    proveedor:     proveedor     || null,
    estado:        "pendiente",
    imagen_url,
  }).select("id, token_aprobacion, prioridades(nombre)").single();

  if (error) {
    return { error: "Error al crear la solicitud: " + error.message };
  }

  // F1: fetch role for redirect (outside WA try block)
  const { data: creatorProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const creatorRole = creatorProfile?.role ?? "solicitante";

  try {
    const adminClient = createAdminClient();

    const [{ data: solProfile }, { data: aprobadores }] = await Promise.all([
      adminClient.from("profiles").select("nombre_completo, role").eq("id", user.id).single(),
      adminClient.from("profiles").select("telefono").eq("role", "aprobador"),
    ]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pagina-de-compras-para-jpintuexpres.vercel.app";
    const token = (inserted as any)?.token_aprobacion;
    const prioridad = (inserted as any)?.prioridades?.nombre;

    if (token) {
      const msg = buildMsgNuevaSolicitud({
        solicitante: solProfile?.nombre_completo ?? "Un empleado",
        motivo,
        monto: costo_estimado,
        placa: placa ?? undefined,
        prioridad,
        linkAprobacion: `${siteUrl}/aprobar/${token}`,
      });

      const telefonos = (aprobadores ?? [])
        .map((a: any) => a.telefono)
        .filter(Boolean) as string[];

      if (telefonos.length > 0) {
        await Promise.all(telefonos.map((to) => sendWhatsApp({ to, message: msg })));
      } else {
        await sendWhatsApp({ message: msg });
      }
    }
  } catch (waErr) {
    console.warn("[WA] No se pudo notificar al aprobador:", waErr);
  }

  const destino = creatorRole === "admin"
    ? "/admin/solicitudes?success=Solicitud creada exitosamente"
    : "/solicitudes?success=Solicitud creada exitosamente";
  redirect(destino);
}
