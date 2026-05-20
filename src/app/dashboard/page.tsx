import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: "/admin",
  aprobador: "/aprobaciones",
  solicitante: "/solicitudes",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, debe_cambiar_password")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Perfil no encontrado — forzar logout
    redirect("/login");
  }

  if (profile.debe_cambiar_password) {
    redirect("/cambiar-password");
  }

  redirect(ROLE_REDIRECT[profile.role as UserRole]);
}
