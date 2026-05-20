import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Suspense } from "react";
import AdminSolicitudesClient from "./AdminSolicitudesClient";

export const dynamic = "force-dynamic";

export default async function AdminSolicitudesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select(`id, motivo, costo_estimado, estado, created_at, fecha_limite,
             lineas(nombre), prioridades(nombre),
             profiles!solicitante_id(nombre_completo)`)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <BackButton href="/admin" label="Panel de administración" />
          <a href="/solicitudes/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </a>
        </div>
        <Suspense fallback={<div className="py-10 text-center text-gray-400 text-sm">Cargando...</div>}>
          <AdminSolicitudesClient solicitudes={(solicitudes as any[]) ?? []} />
        </Suspense>
      </main>
    </div>
  );
}
