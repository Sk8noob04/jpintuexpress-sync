import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import InformesCharts from "@/app/admin/informes/InformesCharts";

export const dynamic = "force-dynamic";

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AprobacionesInformesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || profile.role !== "aprobador") redirect("/dashboard");

  const { data: raw } = await supabase
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, created_at, updated_at, fecha_limite, proveedor,
      comentario_aprobador,
      lineas(nombre), prioridades(nombre),
      profiles!solicitante_id(nombre_completo, email)
    `)
    .order("created_at", { ascending: false });

  const solicitudes = (raw as any[]) ?? [];

  const total      = solicitudes.length;
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");
  const aprobadas  = solicitudes.filter(s => s.estado === "aprobada");
  const rechazadas = solicitudes.filter(s => s.estado === "rechazada");

  const valorAprobado  = aprobadas.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const valorPendiente = pendientes.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const valorRechazado = rechazadas.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);

  const resueltas = [...aprobadas, ...rechazadas];
  const avgDias = resueltas.length
    ? Math.round(resueltas.reduce((sum, s) => {
        return sum + (new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / resueltas.length)
    : null;

  // Monthly chart data
  const now = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleDateString("es-PA", { month: "short" }).replace(/^\w/, c => c.toUpperCase()),
      year: d.getFullYear(), month: d.getMonth(),
      aprobado: 0, rechazado: 0, pendiente: 0,
    };
  });
  for (const s of solicitudes) {
    const d = new Date(s.created_at);
    const m = meses.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (!m) continue;
    if (s.estado === "aprobada")  m.aprobado  += s.costo_estimado ?? 0;
    if (s.estado === "rechazada") m.rechazado += s.costo_estimado ?? 0;
    if (s.estado === "pendiente") m.pendiente += s.costo_estimado ?? 0;
  }

  // By line chart data
  const byLinea: Record<string, { nombre: string; aprobado: number; total: number }> = {};
  for (const s of solicitudes) {
    const key = s.lineas?.nombre ?? "Sin linea";
    if (!byLinea[key]) byLinea[key] = { nombre: key, aprobado: 0, total: 0 };
    byLinea[key].total += s.costo_estimado ?? 0;
    if (s.estado === "aprobada") byLinea[key].aprobado += s.costo_estimado ?? 0;
  }
  const lineasChart = Object.values(byLinea).sort((a, b) => b.aprobado - a.aprobado).slice(0, 8);

  // By person stats
  const byPerson: Record<string, {
    nombre: string; email: string;
    total: number; aprobadas: number; rechazadas: number; pendientes: number; valorTotal: number;
  }> = {};
  for (const s of solicitudes) {
    const key = s.profiles?.email ?? "desconocido";
    if (!byPerson[key]) byPerson[key] = {
      nombre: s.profiles?.nombre_completo ?? "—", email: s.profiles?.email ?? "—",
      total: 0, aprobadas: 0, rechazadas: 0, pendientes: 0, valorTotal: 0,
    };
    byPerson[key].total++;
    byPerson[key].valorTotal += s.costo_estimado ?? 0;
    if (s.estado === "aprobada")  byPerson[key].aprobadas++;
    if (s.estado === "rechazada") byPerson[key].rechazadas++;
    if (s.estado === "pendiente") byPerson[key].pendientes++;
  }
  const personasList = Object.values(byPerson).sort((a, b) => b.total - a.total);

  const pendientesOrdenados = [...pendientes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ─── Multi-sheet export data for aprobador ───────────────────────────────
  const exportData = solicitudes.map(s => ({
    solicitante: s.profiles?.nombre_completo ?? "",
    motivo: s.motivo,
    linea: s.lineas?.nombre ?? "",
    estado: s.estado,
    costo: s.costo_estimado,
    enviada: formatDate(s.created_at),
  }));

  const exportSheets = [
    {
      nombre: "Resumen Ejecutivo",
      filas: [
        { "Indicador": "Total solicitudes",          "Valor": total },
        { "Indicador": "Solicitudes pendientes",     "Valor": pendientes.length },
        { "Indicador": "Solicitudes aprobadas",      "Valor": aprobadas.length },
        { "Indicador": "Solicitudes rechazadas",     "Valor": rechazadas.length },
        { "Indicador": "Monto pendiente (USD)",      "Valor": valorPendiente },
        { "Indicador": "Monto aprobado (USD)",       "Valor": valorAprobado },
        { "Indicador": "Monto rechazado (USD)",      "Valor": valorRechazado },
        { "Indicador": "Tiempo promedio resp (dias)", "Valor": avgDias ?? "N/A" },
        { "Indicador": "Fecha del informe",          "Valor": new Date().toLocaleDateString("es-PA") },
      ],
    },
    {
      nombre: "Solicitudes",
      filas: solicitudes.map(s => ({
        "Solicitante":    s.profiles?.nombre_completo ?? "",
        "Motivo":         s.motivo,
        "Linea":          s.lineas?.nombre ?? "",
        "Prioridad":      s.prioridades?.nombre ?? "",
        "Proveedor":      s.proveedor ?? "",
        "Estado":         s.estado,
        "Costo (USD)":    s.costo_estimado,
        "Comentario":     s.comentario_aprobador ?? "",
        "Fecha limite":   s.fecha_limite ? formatDate(s.fecha_limite) : "",
        "Fecha envio":    formatDate(s.created_at),
      })),
    },
    {
      nombre: "Gasto por Linea",
      filas: Object.values(byLinea)
        .sort((a, b) => b.aprobado - a.aprobado)
        .map(l => ({
          "Linea":            l.nombre,
          "Aprobado (USD)":   l.aprobado,
          "Total pedido (USD)": l.total,
          "% Aprobado":       l.total > 0 ? Math.round((l.aprobado / l.total) * 100) + "%" : "0%",
        })),
    },
    {
      nombre: "Actividad por Empleado",
      filas: personasList.map(p => ({
        "Nombre":          p.nombre,
        "Email":           p.email,
        "Total enviadas":  p.total,
        "Aprobadas":       p.aprobadas,
        "Rechazadas":      p.rechazadas,
        "Pendientes":      p.pendientes,
        "Valor total (USD)": p.valorTotal,
      })),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        <div className="mb-7 flex items-center justify-between flex-wrap gap-3">
          <div>
            <BackButton href="/aprobaciones" label="Solicitudes" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Dashboard de Gastos</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vision general de solicitudes y presupuesto</p>
          </div>
          <Link href="/aprobaciones"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Ver solicitudes pendientes
            {pendientes.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendientes.length}
              </span>
            )}
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total solicitudes", value: total,             sub: "",                          color: "bg-blue-50 border-blue-200",     text: "text-blue-700" },
            { label: "Pendientes",        value: pendientes.length,  sub: formatCurrency(valorPendiente), color: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", pulse: pendientes.length > 0 },
            { label: "Aprobadas",         value: aprobadas.length,   sub: formatCurrency(valorAprobado),  color: "bg-green-50 border-green-200",   text: "text-green-700" },
            { label: "Rechazadas",        value: rechazadas.length,  sub: formatCurrency(valorRechazado), color: "bg-red-50 border-red-200",       text: "text-red-700" },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-2xl border p-4 sm:p-5 ${kpi.color}`}>
              <p className={`text-3xl font-black ${kpi.text}`}>
                {kpi.value}
                {(kpi as any).pulse && kpi.value > 0 && (
                  <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </p>
              <p className={`text-xs font-semibold ${kpi.text} mt-0.5`}>{kpi.label}</p>
              {kpi.sub && <p className={`text-xs mt-1 opacity-70 ${kpi.text}`}>{kpi.sub}</p>}
            </div>
          ))}
        </div>

        {avgDias !== null && (
          <div className={`mb-8 rounded-xl border px-5 py-4 flex items-center gap-4
            ${avgDias <= 1 ? "bg-green-50 border-green-200" : avgDias <= 3 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
            <span className="text-3xl">&#9201;</span>
            <div>
              <p className={`font-bold text-lg ${avgDias <= 1 ? "text-green-700" : avgDias <= 3 ? "text-yellow-700" : "text-red-700"}`}>
                Tiempo promedio de respuesta: <strong>{avgDias} {avgDias === 1 ? "dia" : "dias"}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Entre la fecha de solicitud y la fecha de resolucion</p>
            </div>
          </div>
        )}

        {/* Charts + Export (multi-sheet for aprobador) */}
        <InformesCharts
          meses={meses}
          lineas={lineasChart}
          exportData={exportData}
          exportSheets={exportSheets}
          exportNombre="Informe_Jefe_JPintuexpress"
        />

        {/* Pending by age */}
        {pendientesOrdenados.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              &#9203; Pendientes por antiguedad
              <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendientesOrdenados.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">Ordenadas de mas antigua a mas reciente.</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-yellow-50 border-b border-yellow-200">
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800">Espera</th>
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800">Solicitante</th>
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800">Solicitud</th>
                    <th className="text-right px-4 py-3 font-semibold text-yellow-800">Monto</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendientesOrdenados.map(s => {
                    const dias = diasDesde(s.created_at);
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${dias >= 3 ? "bg-orange-50/40" : ""}`}>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${dias === 0 ? "text-gray-500 dark:text-gray-500" : dias <= 2 ? "text-yellow-600" : "text-red-600"}`}>
                            {dias === 0 ? "hoy" : `${dias}d`}
                            {dias >= 3 && " \uD83D\uDD34"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{s.profiles?.nombre_completo}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(s.created_at)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 max-w-xs truncate">{s.motivo}</p>
                          {s.lineas?.nombre && <p className="text-xs text-gray-400 dark:text-gray-500">{s.lineas.nombre}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{formatCurrency(s.costo_estimado)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/aprobaciones/${s.id}`}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                            Revisar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* By person */}
        {personasList.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">&#128100; Actividad por solicitante</h2>
            <p className="text-xs text-gray-500 mb-4">Resumen de solicitudes y montos por persona.</p>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Solicitante</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Total</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Aprobadas</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Rechazadas</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Pendientes</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Valor total</th>
                  </tr>
                </thead>
                <tbody>
                  {personasList.map(p => (
                    <tr key={p.email} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{p.nombre}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{p.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">{p.total}</td>
                      <td className="px-4 py-3 text-center font-bold text-green-700">{p.aprobadas}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">{p.rechazadas}</td>
                      <td className="px-4 py-3 text-center">
                        {p.pendientes > 0
                          ? <span className="font-bold text-yellow-600">{p.pendientes}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(p.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
