import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { cambiarRol, actualizarTelefono } from "./actions";
import NuevoUsuarioForm from "./NuevoUsuarioForm";
import TelefonoInput from "./TelefonoInput";
import ResetPasswordButton from "./ResetPasswordButton";

const ROLES = ["solicitante", "aprobador", "admin"];

const ROLE_BADGE: Record<string, string> = {
  admin:       "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  aprobador:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  solicitante: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, nombre_completo, email, role, telefono, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <BackButton href="/admin" label="Panel de administración" />

        <NuevoUsuarioForm />

        <div className="glass-card overflow-hidden overflow-x-auto mt-4">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">WhatsApp</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Cambiar rol</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios as any[])?.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-white/30 dark:hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{u.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${ROLE_BADGE[u.role] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TelefonoInput userId={u.id} currentTelefono={u.telefono ?? ""} action={actualizarTelefono} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user.id && (
                      <form action={cambiarRol} className="inline-flex gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="role_anterior" value={u.role} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                     focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200
                                     dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200
                                     rounded transition"
                        >
                          Guardar
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== user.id && (
                      <ResetPasswordButton userId={u.id} userName={u.nombre_completo} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
