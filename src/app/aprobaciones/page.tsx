import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AprobacionesClient from "./AprobacionesClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AprobacionesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "aprobador") redirect("/dashboard");

  const { success, error } = await searchParams;

  const { data: todas } = await supabase
    .from("solicitudes")
    .select(`id, motivo, costo_estimado, estado, fecha_limite, created_at, proveedor, placa,
             lineas(nombre), prioridades(nombre),
             profiles!solicitante_id(nombre_completo)`)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Solicitudes</h1>
            <p className="text-xs text-gray-500 dark:text-gray-500">Revisa y aprueba las solicitudes de compra</p>
          </div>
          <a href="/aprobaciones/informes"
            className="inline-flex items-center gap-2 px-3.5 py-2 glass-card hover:shadow-md text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard de gastos
          </a>
        </div>
        <AprobacionesClient
          solicitudes={(todas as any[]) ?? []}
          success={success}
          error={error}
        />
      </main>
    </div>
  );
}
