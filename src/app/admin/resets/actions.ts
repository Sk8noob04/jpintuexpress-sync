"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function generarLinkReset(formData: FormData) {
  const requestId = formData.get("id") as string;
  const email = formData.get("email") as string;

  if (!requestId || !email) return { error: "Datos incompletos" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return { error: error?.message ?? "No se pudo generar el link" };
  }

  // Mark request as processed
  await adminClient
    .from("password_reset_requests")
    .update({ estado: "procesado" })
    .eq("id", requestId);

  return { ok: true, link: data.properties.action_link };
}
