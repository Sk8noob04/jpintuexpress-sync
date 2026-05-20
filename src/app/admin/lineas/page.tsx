import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { crearLinea, toggleLinea } from "./actions";

interface Props {
  searchParams: Promise<{ error?: string; ok?: string }>;
}

export default async function LineasPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: lineas } = await supabase
    .from("lineas")
    .select("id, nombre, activa")
    .order("nombre");

  const { error, ok } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <BackButton href="/admin" label="Panel de administración" />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        {ok && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">Linea guardada correctamente.</div>
        )}

        <div className="glass-card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nueva linea</h2>
          <form action={crearLinea} className="flex gap-3">
            <input name="nombre" type="text" required placeholder="Nombre de la linea"
              className="flex-1 px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition" />
            <button type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition">
              Agregar
            </button>
          </form>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-500">Nombre</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-500">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-500">Accion</th>
              </tr>
            </thead>
            <tbody>
              {lineas?.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{l.nombre}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${l.activa ? "bg-green-100 text-green-800" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500"}`}>
                      {l.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleLinea} className="inline">
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="activa" value={String(l.activa)} />
                      <button type="submit" className="text-xs text-blue-600 hover:underline">
                        {l.activa ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!lineas || lineas.length === 0) && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No hay lineas aun.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
