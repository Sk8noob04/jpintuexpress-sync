import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import TelefonoAprobadorForm from "./TelefonoAprobadorForm";
import EmailAprobadorForm from "./EmailAprobadorForm";
import { actualizarTelefonoAprobador, actualizarEmailAprobador } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const adminClient = createAdminClient();
  const [
    { data: aprobadores },
    { data: emailSetting },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, nombre_completo, email, telefono")
      .eq("role", "aprobador")
      .order("nombre_completo"),
    adminClient
      .from("app_settings")
      .select("value")
      .eq("key", "email_aprobador")
      .single(),
  ]);

  const emailAprobador = (emailSetting as any)?.value ?? "alexander.castro@soltranes.com";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <BackButton href="/admin" label="Panel de administración" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Configuración</h1>
        <p className="text-sm text-gray-500 mb-8">
          Configura los números de WhatsApp para las notificaciones automáticas.
        </p>

        {/* Sección: Aprobadores / Jefe */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📱</span>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">WhatsApp del Aprobador</h2>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Cuando un empleado crea una solicitud, el sistema notifica automáticamente
                a estos números por WhatsApp con el link de aprobación.
              </p>
            </div>
          </div>

          <TelefonoAprobadorForm
            aprobadores={(aprobadores as any[]) ?? []}
            action={actualizarTelefonoAprobador}
          />
        </div>

        {/* Sección: Email recordatorio */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📧</span>
            <div>
              <h2 className="font-semibold text-gray-900 dark: