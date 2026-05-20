import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const adminClient = createAdminClient();

  // ── Semana actual (domingo→sábado, zona Panama UTC-5) ──────────────────────
  const ahora = new Date();
  const PANAMA_H = 5; // UTC-5, sin horario de verano
  const panamaNow = new Date(ahora.getTime() - PANAMA_H * 3_600_000);
  const diaSem = panamaNow.getUTCDay(); // 0=dom
  const inicioSemPanama = new Date(panamaNow);
  inicioSemPanama.setUTCDate(panamaNow.getUTCDate() - diaSem);
  inicioSemPanama.setUTCHours(0, 0, 0, 0);
  const semanaDesde = new Date(inicioSemPanama.getTime() + PANAMA_H * 3_600_000).toISOString();
  const semanaHasta = new Date(inicioSemPanama.getTime() + PANAMA_H * 3_600_000 + 7 * 86_400_000 - 1).toISOString();

  const [
    { count: totalUsuarios },
    { count: totalLineas },
    { count: totalPendientes },
    { count: totalResets },
    { count: totalPrioridades },
    { data: semanaData },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("lineas").select("*", { count: "exact", head: true }).eq("activa", true),
    supabase.from("solicitudes").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
    adminClient.from("password_reset_requests").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
    adminClient.from("prioridades").select("*", { count: "exact", head: true }),
    // Aprobadas y rechazadas filtradas por semana actual (updated_at)
    supabase.from("solicitudes")
      .select("estado, costo_estimado")
      .in("estado", ["aprobada", "rechazada"])
      .gte("updated_at", semanaDesde)
      .lte("updated_at", semanaHasta),
  ]);

  const semana = (semanaData ?? []) as { estado: string; costo_estimado: number }[];
  const totalAprobadas  = semana.filter(s => s.estado === "aprobada").length;
  const totalRechazadas = semana.filter(s => s.estado === "rechazada").length;
  const gastoAprobado   = semana.filter(s => s.estado === "aprobada").reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const totalSolicitudes = (totalPendientes ?? 0) + totalAprobadas + totalRechazadas;

  const primerNombre = (profile.nombre_completo ?? "Admin").split(" ")[0];

  const stats = {
    total:          totalSolicitudes,
    pendiente:      totalPendientes ?? 0,
    aprobada:       totalAprobadas,
    rechazada:      totalRechazadas,
    gastoAprobado,
    totalUsuarios:  totalUsuarios  ?? 0,
    totalResets:    totalResets    ?? 0,
    totalLineas:    totalLineas    ?? 0,
    totalPrioridades: totalPrioridades ?? 0,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 w-full px-4 sm:px-8 py-5 sm:py-8">
        <AdminDashboardClient stats={stats} primerNombre={primerNombre} />
      </main>
    </div>
  );
}
