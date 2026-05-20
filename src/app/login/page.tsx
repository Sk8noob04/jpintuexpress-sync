import { signIn } from "./actions";
import Image from "next/image";
import LoginButton from "./LoginButton";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string; email?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next, email } = await searchParams;

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel (desktop only) ─────────────────────────────── */}
      <div className="hidden sm:flex flex-col items-center justify-center w-[420px] shrink-0
                      bg-gradient-to-br from-slate-800 via-slate-900 to-gray-950
                      border-r border-white/5 px-12 relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <Image
            src="/logo.png"
            alt="J Pintuexpress S.A."
            width={100}
            height={100}
            className="object-contain mx-auto mb-6 drop-shadow-2xl"
            priority
          />
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">J Pintuexpress S.A.</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            Sistema interno de gestión de solicitudes de compra
          </p>

          <div className="space-y-3 text-left">
            {[
              { icon: "📦", text: "Solicitudes de compra en tiempo real" },
              { icon: "✅", text: "Aprobación directa vía WhatsApp" },
              { icon: "📊", text: "Informes y estadísticas centralizados" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-sm text-slate-300">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-6 text-[11px] text-slate-600">
          Acceso restringido — solo personal autorizado
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center
                      bg-gradient-to-b from-slate-100 to-[#F2F2F7] dark:from-gray-900 dark:to-gray-950
                      sm:bg-gradient-to-br sm:from-slate-200 sm:via-slate-100 sm:to-slate-200
                      dark:sm:from-gray-950 dark:sm:via-slate-900 dark:sm:to-gray-950
                      px-5 py-10 sm:py-8 sm:px-4">
        <div className="w-full max-w-sm">

          {/* Mobile: premium logo header */}
          <div className="sm:hidden text-center mb-8">
            {/* Logo with subtle glow ring */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-blue-500/15 blur-xl scale-150 pointer-events-none" />
                <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center justify-center p-2">
                  <Image
                    src="/logo.png"
                    alt="J Pintuexpress S.A."
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">J Pintuexpress S.A.</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">Sistema de Solicitudes de Compra</p>
            {/* Subtle divider */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wider">Acceso</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden sm:block mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Bienvenido</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <h2 className="sm:hidden text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Iniciar sesión</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <form action={signIn} className="space-y-4">
              {next && <input type="hidden" name="next" value={next} />}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  placeholder="usuario@ejemplo.com"
                  defaultValue={email ?? ""}
                  className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm fo