import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ESTADO_BADGE: Record<string, string> = {
  aprobada:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rechazada: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const ESTADO_LABEL: Record<string, string> = {
  aprobada:  "Aprobada",
  rechazada: "Rechazada",
};

export default async function AprobadorHistorialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");
  if (profile.role === "admin") redirect("/admin");
  if (profile.role !== "aprobador") redirect("/dashboard");

  const { data: raw } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, updated_at, created_at,
      comentario_aprobador, proveedor, placa,
      lineas(nombre), prioridades(nombre),
      solicitante:profiles!solicitante_id(nombre_completo)
    `)
    .eq("aprobador_id", user.id)
    .neq("estado", "pendiente")
    .order("updated_at", { ascending: false });

  const solicitudes = (raw as any[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">

        <div className="mb-6">
          <BackButton href="/aprobaciones" label="Solicitudes" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Mi historial</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Solicitudes que has aprobado o rechazado
          </p>
        </div>

        {solicitudes.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-400 text-sm">
            No has aprobado ni rechazado ninguna solicitud todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((s: any) => (
              <a
                key={s.id}
                href={`/aprobaciones/${s.id}`}
                className="glass-card p-4 sm:p-5 flex items-start gap-4 hover:shadow-md transition block"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold
                      ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 text-gray-700"}`}>
                      {ESTADO_LABEL[s.estado] ?? s.estado}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {s.motivo}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {s.solicitante?.nombre_completo ?? "Solicitante"}
                    </span>
                    {s.lineas?.nombre && (
                      <span className="text-gray-400"> · {s.lineas.nombre}</span>
                    )}
                    {s.prioridades?.nombre && (
                      <span className="text-gray-400"> · {s.prioridades.nombre}</span>
                    )}
                  </p>

                  {s.comentario_aprobador && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      &quot;{s.comentario_aprobador}&quot;
                    </p>
                  )}

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Resuelta el {formatDate(s.updated_at)}
                    {" · "}Enviada el {formatDate(s.created_at)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(s.costo_estimado)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
