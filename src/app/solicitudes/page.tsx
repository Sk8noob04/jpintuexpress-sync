import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import SolicitudesHome from "./SolicitudesHome";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function SolicitudesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "solicitante") redirect("/dashboard");

  const { success, error } = await searchParams;

  const { data: todas } = await supabase
    .from("solicitudes")
    .select(`id, motivo, costo_estimado, estado, fecha_limite, created_at, proveedor, placa,
             lineas(nombre), prioridades(nombre)`)
    .eq("solicitante_id", user.id)
    .order("created_at", { ascending: false });

  const solicitudes = (todas as any[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">
        <SolicitudesHome
          solicitudes={solicitudes}
          nombre={profile.nombre_completo ?? ""}
          success={success}
          error={error}
        />
      </main>
    </div>
  );
}
