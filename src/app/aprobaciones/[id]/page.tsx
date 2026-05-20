import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageLightbox from "@/components/ImageLightbox";
import BackButton from "@/components/BackButton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import AprobacionActions from "./AprobacionActions";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta: "bg-red-100 text-red-700 border-red-200",
  Media: "bg-orange-100 text-orange-700 border-orange-200",
  Baja: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export default async function AprobacionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;

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

  const { data: s } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, imagen_url, created_at, fecha_limite, proveedor, placa, comentario_aprobador,
      lineas(nombre), prioridades(nombre),
      profiles!solicitante_id(nombre_completo, email)
    `)
    .eq("id", id)
    .single();

  if (!s) notFound();
  const sol = s as any;

  const isPendiente = sol.estado === "pendiente";

  const isUrgente = sol.fecha_limite
    ? new Date(sol.fecha_limite) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8">

        <BackButton href="/aprobaciones" label="Solicitudes" />

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {!isPendiente && (
          <div className={`mb-4 p-3.5 rounded-xl text-sm font-medium flex items-center gap-2
            ${sol.estado === "aprobada"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}>
            <span className="text-base">{sol.estado === "aprobada" ? "✓" : "✕"}</span>
            Esta solicitud ya fue <strong>{sol.estado}</strong>.
          </div>
        )}

        {!isPendiente && sol.comentario_aprobador && (
          <div className={`mb-4 p-4 rounded-xl border text-sm
            ${sol.estado === "aprobada"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"}`}>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">Tu comentario</p>
            <p>{sol.comentario_aprobador}</p>
          </div>
        )}

        <div className="glass-card overflow-hidden mb-4">

          <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {sol.prioridades?.nombre && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
                    ${PRIORIDAD_COLOR[sol.prioridades.nombre] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                    {sol.prioridades.nombre === "Alta" ? "🔴" : sol.prioridades.nombre === "Media" ? "🟡" : "🟢"} {sol.prioridades.nombre}
                  </span>
                )}
                {isUrgente && isPendiente && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                    ⚡ Urgente
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
                {formatCurrency(sol.costo_estimado)}
              </p>
            </div>

            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">{sol.motivo}</h1>
          </div>

          <div className="px-5 sm:px-7 py-4 grid grid-cols-2 gap-x-4 gap-y-3.5 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Solicitante</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{sol.profiles?.nombre_completo}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{sol.profiles?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Fecha solicitud</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(sol.created_at)}</p>
            </div>
            {sol.lineas?.nombre && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Linea</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{sol.lineas.nombre}</p>
              </div>
            )}
            {sol.placa && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Placa</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 font-mono">{sol.placa}</p>
              </div>
            )}
            {sol.proveedor && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Proveedor</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{sol.proveedor}</p>
              </div>
            )}
            {sol.fecha_limite && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Fecha límite</p>
                <p className={`font-semibold ${isUrgente ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-gray-100"}`}>
                  {isUrgente ? "⚡ " : ""}{formatDate(sol.fecha_limite)}
                </p>
              </div>
            )}
          </div>

          {sol.imagen_url && (
            <div className="px-5 sm:px-7 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Imagen de referencia / cotización
              </p>
              <ImageLightbox src={sol.imagen_url} alt="Cotización" />
            </div>
          )}
        </div>

        {isPendiente
          ? <AprobacionActions id={sol.id} /