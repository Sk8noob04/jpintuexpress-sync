"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function crearActivo(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  const linea_id = formData.get("linea_id") as string;
  if (!nombre || !linea_id) redirect("/admin/activos?error=Todos los campos son requeridos");

  const supabase = await createClient();
  const { error } = await supabase.from("activos").insert({ nombre, linea_id });
  if (error) redirect("/admin/activos?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin/activos");
  redirect("/admin/activos?ok=1");
}

export async function toggleActivo(formData: FormData) {
  const id = formData.get("id") as string;
  const activo = formData.get("activo") === "true";

  const supabase = await createClient();
  await supabase.from("activos").update({ activo: !activo }).eq("id", id);
  revalidatePath("/admin/activos");
}
