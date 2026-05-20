import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import Image from "next/image";
import AprobacionTokenForm from "./AprobacionTokenForm";
import ImageLightbox from "@/components/ImageLightbox";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  "bg-red-100 text-red-700",
  Media: "bg-orange-100 text-orange-700",
  Baja:  "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500",
};

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobada:  "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
};

function isUrgente(fechaLimite?: string | null) {
  return fechaLimite &&
    new Date(fechaLimite) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
}

export default async function AprobarTokenPage({ params }: Props) {
  const { token } = await params;

  const supabase = createAdminClient();

  const { data: sol } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, proveedor, placa,
      fecha_limite, created_at, imagen_url, comentario_aprobador,
      token_aprobacion,
      prioridades(nombre),
      profiles!solicitante_id(nombre_completo, email)
    `)
    .eq("token_aprobacion", token)
    .single();

  if (!sol) notFound();

  const { data: todas } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, proveedor, placa,
      fecha_limite, created_at, token_aprobacion,
      prioridades(nombre),
      profiles!solicitante_id(nombre_completo)
    `)
    .neq("id", sol.id)
    .order("created_at", { ascending: false });

  const isPendiente = sol.estado === "pendiente";
  const prioridad = (sol as any).prioridades?.nombre as string | undefined;
  const otras = (todas ?? []) as any[];

  const pendientes = otras.filter(s => s.estado === "pendiente");
  const resueltas  = otras.filter(s => s.estado !== "pendiente");

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-lg">

        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo.png"
            alt="J Pintuexpress S.A."
            width={44}
            height={44}
            className="object-contain shrink-0"
            priority
          />
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">Solicitudes de Compra</h1>
            <p className="text-xs text-gray-500 dark:text-gray-500">J Pintuexpress S.A.</p>
          </div>
        </div>

        <div id="solicitud-destacada" className="mb-8">
          {isPendiente ? (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              Nueva solicitud — requiere tu atención
            </div>
          ) : (
            <div className={`mb-3 px-3 py-2 rounded-xl text-sm font-semibold text-center border
              ${sol.estado === "aprobada"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"}`}>
              {sol.estado === "aprobada" ? "Esta solicitud fue APROBADA" : "Esta solicitud fue RECHAZADA"}
              {sol.comentario_aprobador && (
                <p className="font-normal text-xs mt-1 opacity-80">&quot;{sol.comentario_aprobador}&quot;</p>
              )}
            </div>
          )}

          <div className={`backdrop-blur-sm sm:backdrop-blur-xl rounded-2xl overflow-hidden mb-4 ${isPendiente ? "bg-white/80 dark:bg-gray-800/80 border-2 border-blue-300 dark:border-blue-700 shadow-xl shadow-blue-100/40 dark:shadow-blue-900/30" : "glass-card"}`}>
            {sol.imagen_url && (
              <div className="px-4 pt-4">
                <ImageLightbox src={sol.imagen_url} alt="Imagen de referencia / cotización" />
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Solicitante</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{(sol as any).profiles?.nombre_completo}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{(sol as any).profiles?.email}</p>
                </div>
                {prioridad && (
                  <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-bold ${PRIORIDAD_COLOR[prioridad] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500"}`}>
                    {prioridad}
                  </span>
                )}
              </div>

              <hr className="border-gray-100" />

              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Motivo</p>
                <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">{sol.motivo}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Monto</p>
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{formatCurrency(sol.costo_estimado)}</p>
              </div>

              {(sol as any).placa && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Placa</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{(sol as any).placa}</p>
                </div>
              )}
              {sol.proveedor && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Proveedor</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sol.proveedor}</p>
                </div>
              )}

              {sol.fecha_limite && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Fecha limite</p>
                  <p className="text-sm font-medium text-orange-600">{formatDate(sol.fecha_limite)}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500">Solicitud enviada el {formatDateTime(sol.created_at)}</p>
            </div>
          </div>

          {isPendiente && (
            <AprobacionTokenForm solicitudId={sol.id} token={token} />
          )}

        </div>

        {otras.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                Todas las solicitudes
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2.5">
              {pendientes.map((s: any) => <SolicitudCard key={s.id} s={s} />)}
              {resueltas.map((s: any) => <SolicitudCard key={s.id} s={s} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SolicitudCard({ s }: { s: any }) {
  const prioridad: string | undefined = s.prioridades?.nombre;
  const urgente = isUrgente(s.fecha_limite);
  const isPendiente = s.estado === "pendiente";

  const inner = (
    <div className={`bg-white dark:bg-gray-800/80 rounded-2xl border-2 transition ${isPendiente ? urgente ? "border-orange-300 dark:border-orange-600" : "border-gray-200 dark:border-gray-700" : "border-gray-100 dark:border-gray-800 opacity-80"} ${s.token_aprobacion && isPendiente ? "hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md" : ""}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ESTADO_BADGE[s.estado] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500"}`}>
              {s.estado}
            </span>
            {prioridad && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORIDAD_COLOR[prioridad] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500"}`}>
                {prioridad}
              </span>
            )}
            {urgente && isPendiente && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                ! Urgente
              </span>
            )}
          </div>
          <p className={`font-black tabular-nums shrink-0 ${isPendiente ? "text-base text-gray-900 dark:text-gray-100" : "text-sm text-gray-500 dark:text-gray-500"}`}>
            {formatCurrency(s.costo_estimado)}
          </p>
        </div>

        <p className={`font-semibold leading-snug mb-1 ${isPendiente ? "text-gray-900 text-sm" : "text-gray-600 text-xs"}`}>
          {s.motivo}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-500">
          {s.profiles?.nombre_completo}
        </p>
        {s.placa && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{s.placa}</p>
        )}
        {s.proveedor && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 font-medium">Proveedor: {s.proveedor}</p>
        )}
        {s.fecha_limite && (
          <p className={`text-xs mt-1 font-medium ${urgente ? "text-orange-600" : "text-gray-400 dark:text-gray-500"}`}>
            {urgente ? "! " : ""}Límite: {formatDate(s.fecha_limite)}
          </p>
        )}

        {s.token_aprobacion && isPendiente && (
          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              Revisar →
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (s.token_aprobacion && isPendiente) {
    return (
      <a href={`/aprobar/${s.token_aprobacion}`} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
