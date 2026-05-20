"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/admin",
    exact: true,
    iconBg: "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: "Solicitudes",
    href: "/admin/solicitudes",
    iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: "Usuarios",
    href: "/admin/usuarios",
    iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Links de Aprobación",
    href: "/admin/links",
    iconBg: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: "Resets",
    href: "/admin/resets",
    iconBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    title: "Informes",
    href: "/admin/informes",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Prioridades",
    href: "/admin/prioridades",
    iconBg: "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
  /* Líneas oculta — no se usa actualmente */
  {
    title: "Configuración",
    href: "/admin/configuracion",
    iconBg: "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Historial",
    href: "/admin/historial",
    iconBg: "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400",
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function AdminSidebarDesktop() {
  const pathname = usePathname();

  return (
    <aside className="
      hidden sm:flex fixed left-0 top-0 bottom-0 w-56 z-30
      flex-col
      bg-white/90 dark:bg-gray-900/90
      backdrop-blur-xl
      border-r border-gray-200/60 dark:border-white/10
      shadow-[1px_0_0_rgba(0,0,0,0.04)]
    ">
      {/* spacer — matches sticky Navbar height (py-3 × 2 + 68px logo) */}
      <div className="h-[92px] shrink-0 border-b border-gray-100 dark:border-white/5" />

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 mb-2">
          Administración
        </p>
        {NAV_ITEMS.map(item => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100"
                }
              `}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              <span className="truncate">{item.title}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer label */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/5">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium">
          J Pintuexpress — Panel Admin
        </p>
      </div>
    </aside>
  );
}
