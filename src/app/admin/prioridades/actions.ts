"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function verificarAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/dashboard");
}

export async function crearPrioridad(formData: FormData) {
  await verificarAdmin();
  const nombre = (formData.get("nombre") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const nivel = parseInt(formData.get("nivel") as string) || 1;

  if (!nombre) return redirect("/admin/prioridades?error=El nombre es requerido");

  const admin = createAdminClient();
  const { error } = await admin.from("prioridades").insert({ nombre, descripcion: descripcion || null, nivel });
  if (error) return redirect(`/admin/prioridades?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/prioridades");
  redirect("/admin/prioridades?success=Prioridad creada");
}

export async function actualizarPrioridad(formData: FormData) {
  await verificarAdmin();
  const id = formData.get("id") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();
  const nivel = parseInt(formData.get("nivel") as string) || 1;

  if (!id || !nombre) return redirect("/admin/prioridades?error=Datos invalidos");

  const admin = createAdminClient();
  const { error } = await admin.from("prioridades").update({ nombre, descripcion: descripcion || null, nivel }).eq("id", id);
  if (error) return redirect(`/admin/prioridades?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/prioridades");
  redirect("/admin/prioridades?success=Prioridad actualizada");
}

export async function eliminarPrioridad(formData: FormData) {
  await verificarAdmin();
  const id = formData.get("id") as string;
  if (!id) return redirect("/admin/prioridades?error=ID requerido");

  const admin = createAdminClient();
  const { error } = await admin.from("prioridades").delete().eq("id", id);
  if (error) return redirect(`/admin/prioridades?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/prioridades");
  redirect("/admin/prioridades?success=Prioridad eliminada");
}
