import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";
import BackButton from "@/components/BackButton";

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminSolicitudDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: s } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, imagen_url, created_at, updated_at,
      comentario_aprobador, proveedor, fecha_limite,
      lineas(nombre), prioridades(nombre),
      profiles!solicitante_id(nombre_completo, email),
      aprobadores:profiles!aprobador_id(nombre_completo)
    `)
    .eq("id", id)
    .single();

  if (!s) notFound();
  const sol = s as any;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        <BackButton href="/admin/solicitudes" label="Todas las solicitudes" />

        <div className="glass-card p-5 sm:p-8">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-2
                               ${ESTADO_BADGE[sol.estado] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                {sol.estado}
              </span>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 shrink-0">{formatCurrency(sol.costo_estimado)}</p>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">{sol.motivo}</h1>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Solicitante</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                {sol.profiles?.nombre_completo}
                <span className="block text-xs text-gray-400 dark:text-gray-500 font-normal">{sol.profiles?.email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Enviada el</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatDateTime(sol.created_at)}</dd>
            </div>
            {sol.lineas?.nombre && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Linea</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{sol.lineas.nombre}</dd>
              </div>
            )}
            {sol.prioridades?.nombre && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Prioridad</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{sol.prioridades.nombre}</dd>
              </div>
            )}
            {sol.proveedor && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Proveedor</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{sol.proveedor}</dd>
              </div>
            )}
            {sol.fecha_limite && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Fecha limite</dt>
                <dd className="font-medium text-orange-500 dark:text-orange-400 mt-0.5">{formatDate(sol.fecha_limite)}</dd>
              </div>
            )}
            {sol.estado !== "pendiente" && (
              <>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Resuelta el</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatDateTime(sol.updated_at)}</dd>
                </div>
                {sol.aprobadores?.nombre_completo && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Aprobador</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">{sol.aprobadores.nombre_completo}</dd>
                  </div>
                )}
              </>
            )}
          </dl>

          {sol.comentario_aprobador && (
            <div className={`border rounded-xl p-4 mb-6 ${sol.estado === "rechazada" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"}`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario del aprobador</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{sol.comentario_aprobador}</p>
            </div>
          )}

          {sol.imagen_url && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Imagen de referencia / cotizacion</p>
              <ImageLightbox src={sol.imagen_url} alt="Cotizacion" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
