"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function crearLinea(formData: FormData) {
  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) redirect("/admin/lineas?error=El nombre es requerido");

  const supabase = await createClient();
  const { error } = await supabase.from("lineas").insert({ nombre });
  if (error) redirect("/admin/lineas?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin/lineas");
  redirect("/admin/lineas?ok=1");
}

export async function toggleLinea(formData: FormData) {
  const id = formData.get("id") as string;
  const activa = formData.get("activa") === "true";

  const supabase = await createClient();
  await supabase.from("lineas").update({ activa: !activa }).eq("id", id);
  revalidatePath("/admin/lineas");
}
