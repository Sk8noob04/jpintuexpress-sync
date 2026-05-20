import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { formatDate } from "@/lib/utils";
import GenerarLinkButton from "./GenerarLinkButton";

export const dynamic = "force-dynamic";

export default async function ResetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const adminClient = createAdminClient();
  const { data: pendientes } = await adminClient
    .from("password_reset_requests")
    .select("id, email, estado, created_at")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  const { data: procesados } = await adminClient
    .from("password_reset_requests")
    .select("id, email, estado, created_at")
    .eq("estado", "procesado")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <BackButton href="/admin" label="Panel de administración" />
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Solicitudes pendientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {pendientes?.length ?? 0} usuario{pendientes?.length !== 1 ? "s" : ""} esperando link de recuperacion
          </p>
        </div>

        {!pendientes || pendientes.length === 0 ? (
          <div className="glass-card p-12 text-center mb-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500 text-sm">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden overflow-x-auto mb-8">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Solicitado</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {(pendientes as any[]).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{r.email}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <GenerarLinkButton requestId={r.id} email={r.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {procesados && procesados.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Procesados recientemente</h2>
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fecha</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(procesados as any[]).map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.email}</td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-500">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Procesado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
