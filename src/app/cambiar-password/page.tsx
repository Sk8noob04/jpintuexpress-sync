import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cambiarPassword } from "./actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function CambiarPasswordPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cambiar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Debes establecer una nueva contraseña para continuar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={cambiarPassword} className="space-y-4">
            <div>
              <label
                htmlFor="nueva"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Nueva contraseña
              </label>
              <input
                id="nueva"
                name="nueva"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400 transition"
              />
            </div>

            <div>
              <label
                htmlFor="confirmar"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                required
                placeholder="Repite la contraseña"
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white
                         font-semibold rounded-lg text-sm transition focus:outline-none
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
            >
              Guardar y continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
