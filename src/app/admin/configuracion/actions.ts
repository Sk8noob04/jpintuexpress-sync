"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarTelefonoAprobador(formData: FormData) {
  const id       = formData.get("id") as string;
  const telefono = (formData.get("telefono") as string)?.trim().replace(/\D/g, "") || null;

  if (!id) return { error: "ID requerido" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || me.role !== "admin") return { error: "Sin permiso" };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("profiles").update({ telefono }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/configuracion");
  return { ok: true };
}
