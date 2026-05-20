"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function registrarAudit(
  admin_id: string,
  usuario_id: string,
  accion: string,
  detalles: Record<string, unknown> = {}
) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("user_audit_log").insert({
      admin_id,
      usuario_id,
      accion,
      detalles,
    });
  } catch {
    // Audit failures should not block the main action
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function actualizarTelefono(formData: FormData) {
  const id       = formData.get("id") as string;
  const telefono = (formData.get("telefono") as string)?.trim().replace(/\D/g, "") || null;
  if (!id) return { error: "ID requerido" };

  // F2: Check phone uniqueness
  if (telefono) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("telefono", telefono)
      .neq("id", id)
      .maybeSingle();
    if (existing) return { error: "Este telefono ya esta registrado en otro usuario." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ telefono }).eq("id", id);
  if (error) return { error: error.message };

  // F3: Audit
  const adminId = await getAdminId();
  if (adminId) await registrarAudit(adminId, id, "actualizar_telefono", { telefono });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function crearUsuario(formData: FormData) {
  const email           = (formData.get("email") as string)?.trim();
  const nombre_completo = (formData.get("nombre_completo") as string)?.trim();
  const role            = formData.get("role") as string;
  const telefono        = (formData.get("telefono") as string)?.trim().replace(/\D/g, "") || null;

  if (!email || !nombre_completo || !role) {
    return { error: "Todos los campos son requeridos" };
  }

  // F2: Check phone uniqueness before creating
  if (telefono) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("telefono", telefono)
      .maybeSingle();
    if (existing) return { error: "Este telefono ya esta registrado en otro usuario." };
  }

  const tempPassword = "Temporal2026!" + Math.floor(Math.random() * 9000 + 1000);

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { nombre_completo, role },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "No se pudo crear el usuario" };

  // Mark profile so user must change password on first login + guardar telefono
  await adminClient
    .from("profiles")
    .update({ debe_cambiar_password: true, ...(telefono ? { telefono } : {}) })
    .eq("id", data.user.id);

  // F3: Audit
  const adminId = await getAdminId();
  if (adminId) await registrarAudit(adminId, data.user.id, "crear_usuario", { email, nombre_completo, role });

  revalidatePath("/admin/usuarios");
  return { ok: true, tempPassword };
}

export async function cambiarRol(formData: FormData) {
  const id      = formData.get("id") as string;
  const role    = formData.get("role") as string;
  const roleAnterior = formData.get("role_anterior") as string | null;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);

  // F3: Audit
  const adminId = await getAdminId();
  if (adminId) await registrarAudit(adminId, id, "cambiar_rol", {
    rol_anterior: roleAnterior ?? "desconocido",
    rol_nuevo: role,
  });

  revalidatePath("/admin/usuarios");
}

export async function resetearPassword(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido" };

  const tempPassword = "Temporal2026!" + Math.floor(Math.random() * 9000 + 1000);

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(id, {
    password: tempPassword,
  });

  if (error) return { error: error.message };

  await adminClient
    .from("profiles")
    .update({ debe_cambiar_password: true })
    .eq("id", id);

  // F3: Audit
  const adminId = await getAdminId();
  if (adminId) await registrarAudit(adminId, id, "resetear_password", {});

  revalidatePath("/admin/usuarios");
  return { ok: true, tempPassword };
}
