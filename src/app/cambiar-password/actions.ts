"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function cambiarPassword(formData: FormData) {
  const nueva = formData.get("nueva") as string;
  const confirmar = formData.get("confirmar") as string;

  if (!nueva || nueva.length < 8) {
    return redirect(
      `/cambiar-password?error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}`
    );
  }

  if (nueva !== confirmar) {
    return redirect(
      `/cambiar-password?error=${encodeURIComponent("Las contraseñas no coinciden")}`
    );
  }

  const supabase = await createClient();

  // Actualizar contraseña en Supabase Auth
  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    return redirect(
      `/cambiar-password?error=${encodeURIComponent("Error al cambiar la contraseña. Intenta de nuevo.")}`
    );
  }

  // Marcar debe_cambiar_password = false en profiles
  await supabase
    .from("profiles")
    .update({ debe_cambiar_password: false })
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");

  redirect("/dashboard");
}
