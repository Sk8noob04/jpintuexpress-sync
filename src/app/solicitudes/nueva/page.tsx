import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import NuevaForm from "./NuevaForm";

interface Props {
  searchParams: Promise<{
    error?: string;
    motivo?: string;
    placa?: string;
    proveedor?: string;
    costo?: string;
    prioridad_id?: string;
    fecha_limite?: string;
  }>;
}

export default async function NuevaSolicitudPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["solicitante", "admin"].includes(profile.role)) redirect("/dashboard");

  const { data: prioridades } = await supabase
    .from("prioridades")
    .select("id, nombre, nivel")
    .order("nivel");

  const { error, motivo, placa, proveedor, costo, prioridad_id, fecha_limite } = await searchParams;
  // Use Panama timezone (UTC-5) so the "today" min date matches the user's local day
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Panama" });
  const isSimilar = !!(motivo || placa || proveedor || costo);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <BackButton href={profile.role === "admin" ? "/admin/solicitudes" : "/solicitudes"} label={profile.role === "admin" ? "Solicitudes (admin)" : "Mis solicitudes"} />

        <div className="glass-card p-5 sm:p-8">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Nueva solicitud de compra</h1>
          {isSimilar && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-5">
              Campos pre-llenados desde solicitud similar
            </p>
          )}
          <NuevaForm
            prioridades={prioridades ?? []}
            hoy={hoy}
            error={error}
            defaultMotivo={motivo}
            defaultPlaca={placa}
            defaultProveedor={proveedor}
            defaultCosto={costo}
            defaultPrioridadId={prioridad_id}
            defaultFechaLimite={fecha_limite}
          />
        </div>
      </main>
    </div>
  );
}
