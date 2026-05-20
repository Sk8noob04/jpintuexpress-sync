import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import InformesCharts from "./InformesCharts";

export const dynamic = "force-dynamic";

function diasDesde(fecha: string) {
  return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
}

function tiempoRespuesta(created: string, updated: string) {
  const dias = Math.floor(
    (new Date(updated).getTime() - new Date(created).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dias === 0) return "mismo día";
  if (dias === 1) return "1 día";
  return `${dias} días`;
}

export default async function InformesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, estado, created_at, updated_at,
      comentario_aprobador, fecha_limite,
      lineas(nombre),
      profiles!solicitante_id(nombre_completo, email),
      aprobadores:profiles!aprobador_id(nombre_completo)
    `)
    .order("created_at", { ascending: false });

  const solicitudes = (raw as any[]) ?? [];

  // ── Global stats ──────────────────────────────────────────────────────────
  const total      = solicitudes.length;
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");
  const aprobadas  = solicitudes.filter(s => s.estado === "aprobada");
  const rechazadas = solicitudes.filter(s => s.estado === "rechazada");

  const valorTotal     = solicitudes.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const valorAprobado  = aprobadas.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const valorRechazado = rechazadas.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);
  const valorPendiente = pendientes.reduce((a, s) => a + (s.costo_estimado ?? 0), 0);

  // ── Average response time ─────────────────────────────────────────────────
  const resueltas = [...aprobadas, ...rechazadas];
  const avgDias = resueltas.length
    ? Math.round(
        resueltas.reduce((sum, s) => {
          const d = (new Date(s.updated_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return sum + d;
        }, 0) / resueltas.length
      )
    : null;

  // ── Pending sorted by age (oldest first) ─────────────────────────────────
  const pendientesOrdenados = [...pendientes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // ── Per-solicitante stats ─────────────────────────────────────────────────
  const byPerson: Record<string, {
    nombre: string; email: string;
    total: number; aprobadas: number; rechazadas: number; pendientes: number;
    valorTotal: number; valorAprobado: number; valorRechazado: number;
  }> = {};

  for (const s of solicitudes) {
    const key = s.profiles?.email ?? "desconocido";
    if (!byPerson[key]) {
      byPerson[key] = {
        nombre: s.profiles?.nombre_completo ?? "—",
        email: s.profiles?.email ?? "—",
        total: 0, aprobadas: 0, rechazadas: 0, pendientes: 0,
        valorTotal: 0, valorAprobado: 0, valorRechazado: 0,
      };
    }
    const p = byPerson[key];
    p.total++;
    p.valorTotal += s.costo_estimado ?? 0;
    if (s.estado === "aprobada")  { p.aprobadas++;  p.valorAprobado  += s.costo_estimado ?? 0; }
    if (s.estado === "rechazada") { p.rechazadas++; p.valorRechazado += s.costo_estimado ?? 0; }
    if (s.estado === "pendiente") { p.pendientes++; }
  }

  const personasList = Object.values(byPerson).sort((a, b) => b.total - a.total);

  // ── Monthly spending (last 6 months, approved only) ───────────────────────
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

  // ── By line ───────────────────────────────────────────────────────────────
  const byLinea: Record<string, { nombre: string; aprobado: number; total: number }> = {};
  for (const s of solicitudes) {
    const key = s.lineas?.nombre ?? "Sin linea";
    if (!byLinea[key]) byLinea[key] = { nombre: key, aprobado: 0, total: 0 };
    byLinea[key].total += s.costo_estimado ?? 0;
    if (s.estado === "aprobada") byLinea[key].aprobado += s.costo_estimado ?? 0;
  }
  const lineasChart = Object.values(byLinea).sort((a, b) => b.aprobado - a.aprobado).slice(0, 8);

  // ── Export data ───────────────────────────────────────────────────────────
  const exportData = solicitudes.map(s => ({
    solicitante: s.profiles?.nombre_completo ?? "",
    motivo: s.motivo,
    linea: s.lineas?.nombre ?? "",
    estado: s.estado,
    costo: s.costo_estimado,
    enviada: formatDate(s.created_at),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-7">
          <BackButton href="/admin" label="Panel de administración" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Informe de Solicitudes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen completo de actividad · generado en tiempo real</p>
        </div>

        {/* ── 1. KPIs ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total solicitudes", value: total, sub: formatCurrency(valorTotal), color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40", text: "text-blue-700 dark:text-blue-300" },
            { label: "Pendientes", value: pendientes.length, sub: formatCurrency(valorPendiente), color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40", text: "text-yellow-700 dark:text-yellow-300", alert: pendientes.length > 0 },
            { label: "Aprobadas", value: aprobadas.length, sub: formatCurrency(valorAprobado), color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40", text: "text-green-700 dark:text-green-300" },
            { label: "Rechazadas", value: rechazadas.length, sub: formatCurrency(valorRechazado), color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40", text: "text-red-700 dark:text-red-300" },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-2xl border p-4 sm:p-5 ${kpi.color}`}>
              <p className={`text-3xl font-black ${kpi.text}`}>
                {kpi.value}
                {kpi.alert && kpi.value > 0 && (
                  <span className="ml-2 inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </p>
              <p className={`text-xs font-semibold ${kpi.text} mt-0.5`}>{kpi.label}</p>
              <p className={`text-xs mt-1 opacity-70 ${kpi.text}`}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Avg response time */}
        {avgDias !== null && (
          <div className={`mb-8 rounded-xl border px-5 py-4 flex items-center gap-4
            ${avgDias <= 1 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40" : avgDias <= 3 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40"}`}>
            <span className="text-3xl">⏱</span>
            <div>
              <p className={`font-bold text-lg ${avgDias <= 1 ? "text-green-700 dark:text-green-300" : avgDias <= 3 ? "text-yellow-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>
                Tiempo promedio de respuesta: <strong>{avgDias} {avgDias === 1 ? "día" : "días"}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Promedio entre la fecha de solicitud y la fecha de resolución</p>
            </div>
          </div>
        )}

        {/* ── CHARTS ────────────────────────────────────────────────────────── */}
        <InformesCharts
          meses={meses}
          lineas={lineasChart}
          exportData={exportData}
        />

        {/* ── 2. SOLICITUDES PENDIENTES POR ANTIGÜEDAD ─────────────────────── */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            ⏳ Solicitudes pendientes por antigüedad
            {pendientesOrdenados.length > 0 && (
              <span className="bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendientesOrdenados.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Ordenadas de más antigua a más reciente — evidencia de tiempos de espera sin resolución.
          </p>

          {pendientesOrdenados.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 text-sm">
              No hay solicitudes pendientes.
            </div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/40">
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800 dark:text-yellow-300">Días en espera</th>
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800 dark:text-yellow-300">Solicitante</th>
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800 dark:text-yellow-300">Solicitud</th>
                    <th className="text-left px-4 py-3 font-semibold text-yellow-800 dark:text-yellow-300">Fecha solicitud</th>
                    <th className="text-right px-4 py-3 font-semibold text-yellow-800 dark:text-yellow-300">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientesOrdenados.map((s) => {
                    const dias = diasDesde(s.created_at);
                    const isOld = dias >= 3;
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${isOld ? "bg-orange-50/40 dark:bg-orange-900/10" : ""}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-base
                            ${dias === 0 ? "text-gray-500 dark:text-gray-500" : dias <= 2 ? "text-yellow-600" : "text-red-600"}`}>
                            {dias === 0 ? "hoy" : `${dias}d`}
                            {isOld && <span title="Lleva más de 3 días sin respuesta">🔴</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{s.profiles?.nombre_completo}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{s.profiles?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 font-medium max-w-xs truncate">{s.motivo}</p>
                          {s.lineas?.nombre && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.lineas.nombre}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{formatCurrency(s.costo_estimado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800/40">
                    <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                      Total en espera
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-yellow-800 dark:text-yellow-300">
                      {formatCurrency(valorPendiente)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* ── 3. POR SOLICITANTE ───────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">👤 Actividad por solicitante</h2>
          <p className="text-xs text-gray-500 mb-4">Resumen de solicitudes, montos y tasas de aprobación por persona.</p>

          {personasList.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 text-sm">
              Sin datos.
            </div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Solicitante</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Total</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">✓ Aprobadas</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">✕ Rechazadas</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">⏳ Pendientes</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">Valor total</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-500">% Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {personasList.map((p) => {
                    const resueltas = p.aprobadas + p.rechazadas;
                    const tasaAprobacion = resueltas > 0 ? Math.round((p.aprobadas / resueltas) * 100) : null;
                    return (
                      <tr key={p.email} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{p.nombre}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">{p.total}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-green-700">{p.aprobadas}</span>
                          {p.aprobadas > 0 && (
                            <p className="text-xs text-green-600">{formatCurrency(p.valorAprobado)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-red-600">{p.rechazadas}</span>
                          {p.rechazadas > 0 && (
                            <p className="text-xs text-red-500">{formatCurrency(p.valorRechazado)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.pendientes > 0 ? (
                            <span className="font-bold text-yellow-600">{p.pendientes}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(p.valorTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {tasaAprobacion !== null ? (
                            <span className={`font-bold text-sm
                              ${tasaAprobacion >= 70 ? "text-green-700" : tasaAprobacion >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                              {tasaAprobacion}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">sin resolver</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── 4. SOLICITUDES RECHAZADAS ────────────────────────────────────── */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            ✕ Solicitudes rechazadas
            {rechazadas.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {rechazadas.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mb-4">Detalle de cada solicitud rechazada con el comentario del aprobador.</p>

          {rechazadas.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-400 text-sm">
              Ninguna solicitud ha sido rechazada.
            </div>
          ) : (
            <div className="glass-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/40">
                    <th className="text-left px-4 py-3 font-semibold text-red-800 dark:text-red-300">Solicitante</th>
                    <th className="text-left px-4 py-3 font-semibold text-red-800 dark:text-red-300">Solicitud</th>
                    <th className="text-left px-4 py-3 font-semibold text-red-800 dark:text-red-300">Motivo de rechazo</th>
                    <th className="text-left px-4 py-3 font-semibold text-red-800 dark:text-red-300">Rechazado por</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-800 dark:text-red-300">Tiempo espera</th>
                    <th className="text-right px-4 py-3 font-semibold text-red-800 dark:text-red-300">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rechazadas.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-red-50/30 dark:hover:bg-red-900/10">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{s.profiles?.nombre_completo}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(s.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800 max-w-[200px] truncate" title={s.motivo}>{s.motivo}</p>
                        {s.lineas?.nombre && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{s.lineas.nombre}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.comentario_aprobador ? (
                          <p className="text-gray-700 italic text-xs max-w-[200px]">"{s.comentario_aprobador}"</p>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin comentario</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {s.aprobadores?.nombre_completo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-500">
                        {tiempoRespuesta(s.created_at, s.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-700">
                        {formatCurrency(s.costo_estimado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800/40">
                    <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-red-800 dark:text-red-300">
                      Total rechazado
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-red-800 dark:text-red-300">
                      {formatCurrency(valorRechazado)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
