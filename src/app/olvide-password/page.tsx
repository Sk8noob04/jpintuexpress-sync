import { solicitarReset } from "./actions";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function OlvidePasswordPage({ searchParams }: Props) {
  const { success, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">JPintuExpress</h1>
          <p className="text-sm text-gray-500 mt-1">Recuperar acceso</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Solicitud enviada</h2>
              <p className="text-sm text-gray-500 mb-6">
                El administrador recibio tu solicitud. Cuando la apruebe te enviara un link para restablecer tu contrasena.
              </p>
              <a href="/login" className="text-sm text-blue-600 hover:underline">Volver al inicio de sesion</a>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Olvide mi contrasena</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ingresa tu correo y el administrador recibira una solicitud para enviarte un link de restablecimiento.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form action={solicitarReset} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electronico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder:text-gray-400 transition"
                  />
                </div>

                <button type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white
                             font-semibold rounded-lg text-sm transition mt-2">
                  Enviar solicitud
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="/login" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500">
                  Volver al inicio de sesion
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
