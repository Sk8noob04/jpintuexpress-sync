import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import HistorialClient from "./HistorialClient";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, created_at, updated_at,
      comentario_aprobador, proveedor, placa,
      lineas(nombre),
      prioridades(nombre),
      solicitante:profiles!solicitante_id(nombre_completo),
      aprobador:profiles!aprobador_id(nombre_completo)
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  const registros = (solicitudes ?? []) as any[];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 space-y-4">

        <BackButton href="/admin" label="Panel admin" />

        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Historial de actividad</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Registro completo de acciones sobre solicitudes
          </p>
        </div>

        <HistorialClient solicitudes={registros} />

      </main>
    </div>
  );
}
