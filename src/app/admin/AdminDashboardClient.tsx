"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Stats {
  total: number;
  pendiente: number;
  aprobada: number;
  rechazada: number;
  gastoAprobado: number;
  totalUsuarios: number;
  totalResets: number;
  totalLineas: number;
  totalPrioridades: number;
}

interface Props {
  stats: Stats;
  primerNombre: string;
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ pendiente, aprobada, rechazada }: {
  pendiente: number; aprobada: number; rechazada: number;
}) {
  const total = pendiente + aprobada + rechazada;
  const r = 80; const cx = 90; const cy = 90;
  const circ = 2 * Math.PI * r;

  const segments = [
    { label: "Pendientes", count: pendiente, color: "#f59e0b", trackColor: "rgba(245,158,11,0.15)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { label: "Aprobadas",  count: aprobada,  color: "#10b981", trackColor: "rgba(16,185,129,0.15)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { label: "Rechazadas", count: rechazada, color: "#ef4444", trackColor: "rgba(239,68,68,0.15)",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  let cumPct = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full">

      {/* ── Donut ── */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <svg viewBox="0 0 180 180" className="w-40 h-40 sm:w-52 sm:h-52">
          {/* track ring */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="rgba(0,0,0,0.07)" strokeWidth={20} />
          {total === 0
            ? <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="rgba(0,0,0,0.08)" strokeWidth={20} />
            : segments.map((seg, i) => {
                const pct   = seg.count / total;
                const dash  = pct * circ;
                const rot   = cumPct * 360 - 90;
                cumPct     += pct;
                if (dash === 0) return null;
                return (
                  <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={seg.color} strokeWidth={20}
                    strokeDasharray={`${dash} ${circ}`}
                    transform={`rotate(${rot}, ${cx}, ${cy})`}
                    strokeLinecap="butt" />
                );
              })
          }
          {/* center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="34"
            fontWeight="900" className="fill-gray-900 dark:fill-gray-100"
            style={{ fontFamily: "inherit" }}>
            {total}
          </text>
          <text x={cx} y={cy + 13} textAnchor="middle" fontSize="13"
            fill="#9ca3af" style={{ fontFamily: "inherit" }}>
            solicitudes
          </text>
        </svg>

        {/* color dots legend below donut */}
        <div className="flex items-center gap-4">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Segment rows with progress bars ── */}
      <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={i} className="space-y-1.5">
              {/* row: icon + label + count */}
              <div className="flex items-center gap-3">
                {/* colored icon badge */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: seg.trackColor, color: seg.color }}>
                  {seg.icon}
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex-1">
                  {seg.label}
                </span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums leading-none"
                  style={{ color: seg.color }}>
                  {seg.count}
                </span>
                <span className="text-sm font-semibold text-gray-400 w-10 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
              {/* progress bar */}
              <div className="h-2 rounded-full overflow-hidden"
                style={{ background: seg.trackColor }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: seg.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Menu options ─────────────────────────────────────────────────────────────
interface MenuOption {
  title: string; desc: string; href: string;
  iconBg: string; urgent?: boolean; badge?: number;
  icon: React.ReactNode;
}

function buildMenu(stats: Stats): MenuOption[] {
  return [
    {
      title: "Solicitudes", desc: "Ver y filtrar todas las solicitudes",
      href: "/admin/solicitudes",
      iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
      badge: stats.pendiente, urgent: stats.pendiente > 0,
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
    {
      title: "Usuarios", desc: "Crear y gestionar cuentas",
      href: "/admin/usuarios",
      iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
      badge: stats.totalUsuarios,
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      title: "Links de Aprobación", desc: "Links directos por WhatsApp",
      href: "/admin/links",
      iconBg: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
      badge: stats.pendiente, urgent: stats.pendiente > 0,
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    },
    {
      title: "Resets", desc: "Contraseñas olvidadas",
      href: "/admin/resets",
      iconBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
      badge: stats.totalResets, urgent: stats.totalResets > 0,
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    },
    {
      title: "Informes", desc: "Estadísticas y análisis",
      href: "/admin/informes",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      title: "Prioridades", desc: "Niveles de prioridad",
      href: "/admin/prioridades",
      iconBg: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
      badge: stats.totalPrioridades,
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
    },
    {
      title: "Configuración", desc: "WhatsApp y notificaciones",
      href: "/admin/configuracion",
      iconBg: "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400",
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      title: "Historial", desc: "Registro de cambios de usuarios",
      href: "/admin/historial",
      iconBg: "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400",
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];
}

const STORAGE_KEY = "admin_quick_access";
const MAX_PINNED  = 4;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, href }: {
  label: string; value: string | number; sub?: string;
  accent: string; icon: React.ReactNode; href?: string;
}) {
  const inner = (
    <div className={`glass-card p-5 sm:p-6 border-l-4 ${accent} ${href ? "hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 leading-none">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
  if (href) return <a href={href}>{inner}</a>;
  return inner;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboardClient({ stats, primerNombre }: Props) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const menuOptions = buildMenu(stats);

  const defaultPinned = menuOptions.slice(0, MAX_PINNED).map(o => o.href);
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>(defaultPinned);
  const [draft, setDraft]             = useState<string[]>(defaultPinned);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const valid = parsed.filter(h => menuOptions.some(o => o.href === h));
        if (valid.length > 0) { setPinnedHrefs(valid); setDraft(valid); }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openConfig() { setDraft([...pinnedHrefs]); setConfigOpen(true); }

  function toggleDraft(href: string) {
    setDraft(prev =>
      prev.includes(href)
        ? prev.filter(h => h !== href)
        : prev.length < MAX_PINNED ? [...prev, href] : prev
    );
  }

  function saveConfig() {
    setPinnedHrefs(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setConfigOpen(false);
  }

  const pinnedOptions = menuOptions.filter(o => pinnedHrefs.includes(o.href));
  const urgentes      = menuOptions.filter(o => o.urgent);

  return (
    <div className="pb-24 sm:pb-8 space-y-5 sm:space-y-6">

      {/* ── Greeting ── */}
      <div className="glass-card p-5 sm:p-6 flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900
                        flex items-center justify-center text-white font-black text-xl sm:text-2xl shrink-0 shadow">
          {primerNombre[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium">Panel de administración</p>
          <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-gray-100">
            Hola, {primerNombre} 👋
          </p>
        </div>
        <div className="ml-auto text-sm text-gray-400 text-right hidden sm:block">
          {formatDateTime(new Date().toISOString())}
        </div>
      </div>

      {/* ── Stats row — 2 cols mobile / 4 cols desktop ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Pendientes" value={stats.pendiente}
          href="/admin/solicitudes?estado=pendiente"
          sub={stats.pendiente > 0 ? "Requieren atención" : "Al día ✓"}
          accent="border-l-yellow-400 dark:border-l-yellow-500"
          icon={<svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Aprobadas" value={stats.aprobada}
          href="/admin/solicitudes?estado=aprobada"
          sub="Esta semana"
          accent="border-l-emerald-500 dark:border-l-emerald-400"
          icon={<svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Rechazadas" value={stats.rechazada}
          href="/admin/solicitudes?estado=rechazada"
          sub="Esta semana"
          accent="border-l-red-500 dark:border-l-red-400"
          icon={<svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Gasto aprobado" value={formatCurrency(stats.gastoAprobado)}
          href="/admin/solicitudes?estado=aprobada"
          sub="Esta semana"
          accent="border-l-blue-500 dark:border-l-blue-400"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* ── Main: 3-col desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 items-start">

        {/* Left 2-cols: Chart + extras */}
        <div className="sm:col-span-2 space-y-5">

          {/* Donut card */}
          <div className="glass-card p-5 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Distribución de solicitudes
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  Estado actual del sistema
                </p>
              </div>
              <a href="/admin/informes"
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 hidden sm:block">
                Ver informes →
              </a>
            </div>
            <DonutChart
              pendiente={stats.pendiente}
              aprobada={stats.aprobada}
              rechazada={stats.rechazada}
            />
          </div>

          {/* Urgentes */}
          {urgentes.length > 0 && (
            <div className="glass-card p-5 sm:p-6 border-l-4 border-l-orange-400
                            bg-orange-50/40 dark:bg-orange-900/10">
              <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Requieren atención
              </p>
              <div className="space-y-2.5">
                {urgentes.map(o => (
                  <a key={o.href} href={o.href}
                    className="flex items-center justify-between py-2 hover:opacity-75 transition">
                    <span className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200">{o.title}</span>
                    <span className="text-sm font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-full">
                      {o.badge} pendientes
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mini counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <a href="/admin/usuarios"
              className="glass-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
              <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">{stats.totalUsuarios}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Usuarios</p>
            </a>
            <a href="/admin/prioridades"
              className="glass-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center">
              <p className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400">{stats.totalPrioridades}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Prioridades</p>
            </a>
            <a href="/admin/resets"
              className={`glass-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center col-span-2 sm:col-span-1
                ${stats.totalResets > 0 ? "border-l-4 border-l-orange-400" : ""}`}>
              <p className={`text-2xl sm:text-3xl font-black ${stats.totalResets > 0 ? "text-orange-500 dark:text-orange-400" : "text-gray-700 dark:text-gray-300"}`}>
                {stats.totalResets}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Resets pendientes</p>
            </a>
          </div>
        </div>

        {/* Right: Acceso rápido */}
        <div>
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">Acceso rápido</h2>
              <div className="flex items-center gap-3">
                <button onClick={openConfig}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  title="Configurar accesos">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button onClick={() => setMenuOpen(true)}
                  className="text-xs sm:hidden text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Ver todo →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
              {pinnedOptions.map(o => (
                <a key={o.href} href={o.href}
                  className="glass-card sm:bg-transparent sm:border-0 sm:shadow-none sm:rounded-none
                             sm:border-b sm:border-gray-100 sm:dark:border-white/5 sm:last:border-0
                             p-3.5 sm:p-0 sm:py-5
                             flex sm:flex-row flex-col gap-3 sm:gap-4 items-start sm:items-center
                             hover:shadow-md sm:hover:shadow-none hover:-translate-y-0.5 sm:hover:translate-y-0
                             sm:hover:bg-gray-50/50 sm:dark:hover:bg-white/5 sm:rounded-xl sm:px-3
                             transition-all group">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${o.iconBg}`}>
                    {o.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                      {o.title}
                    </p>
                    {o.badge != null && o.badge > 0 && (
                      <span className={`inline-block mt-0.5 text-xs sm:text-sm font-bold px-2 py-0.5 rounded-full
                        ${o.urgent ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                   : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                        {o.badge}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 hidden sm:block"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>

            {/* Resumen */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/8">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Resumen</p>
              <div className="space-y-2.5">
                {[
                  { label: "Tasa de aprobación",    value: stats.total > 0 ? `${Math.round((stats.aprobada  / stats.total) * 100)}%` : "—", color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Tasa de rechazo",        value: stats.total > 0 ? `${Math.round((stats.rechazada / stats.total) * 100)}%` : "—", color: "text-red-500 dark:text-red-400"    },
                  { label: "Promedio por solicitud", value: stats.aprobada > 0 ? formatCurrency(stats.gastoAprobado / stats.aprobada) : "—", color: "text-blue-600 dark:text-blue-400"  },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAB mobile ── */}
      <button onClick={() => setMenuOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full
                   bg-gray-900 dark:bg-white text-white dark:text-gray-900
                   shadow-2xl shadow-black/30 flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-transform"
        aria-label="Menú">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Bottom Sheet — Menú ── */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80
                          backdrop-blur-2xl border-t border-white/40 dark:border-white/10
                          rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Menú</h3>
                <button onClick={() => setMenuOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 pb-8">
                {menuOptions.map(o => (
                  <a key={o.href} href={o.href}
                    className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/50 dark:bg-white/5
                               border border-white/40 dark:border-white/10
                               hover:bg-white/70 dark:hover:bg-white/10 transition active:scale-[0.99]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.iconBg}`}>
                      {o.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{o.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{o.desc}</p>
                    </div>
                    {o.badge != null && o.badge > 0 && (
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full
                        ${o.urgent ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                   : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                        {o.badge}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bottom Sheet — Config ── */}
      {configOpen && (
        <>
          <div onClick={() => setConfigOpen(false)} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90
                          backdrop-blur-2xl border-t border-white/40 dark:border-white/10
                          rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="px-5 py-3 pb-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Configurar acceso rápido</h3>
                <button onClick={() => setConfigOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Selecciona hasta {MAX_PINNED} accesos. Elegidos:{" "}
                <span className={`font-semibold ${draft.length >= MAX_PINNED ? "text-orange-500" : "text-blue-500"}`}>
                  {draft.length}/{MAX_PINNED}
                </span>
              </p>
              <div className="grid grid-cols-1 gap-2 mb-5">
                {menuOptions.map(o => {
                  const selected = draft.includes(o.href);
                  const disabled = !selected && draft.length >= MAX_PINNED;
                  return (
                    <button key={o.href} onClick={() => toggleDraft(o.href)}
                      disabled={disabled}
                      className={`flex items-center gap-4 p-3.5 rounded-2xl border text-left transition
                        ${selected
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500/40"
                          : disabled
                          ? "bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/5 opacity-40 cursor-not-allowed"
                          : "bg-white/50 dark:bg-white/5 border-white/40 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10"
                        }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.iconBg}`}>
                        {o.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{o.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{o.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
                        ${selected ? "bg-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={saveConfig}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition text-sm">
                Guardar accesos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
