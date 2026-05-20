"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function solicitarReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return redirect("/olvide-password?error=Ingresa tu correo electronico");
  }

  const adminClient = createAdminClient();

  // Verify user exists in our system
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .single();

  if (!profiles) {
    return redirect("/olvide-password?error=No encontramos una cuenta con ese correo");
  }

  // Create reset request
  const { error } = await adminClient
    .from("password_reset_requests")
    .insert({ email, estado: "pendiente" });

  if (error) {
    const msg = encodeURIComponent("Error al enviar la solicitud. Intenta de nuevo.");
    return redirect(`/olvide-password?error=${msg}`);
  }

  redirect("/olvide-password?success=1");
}
