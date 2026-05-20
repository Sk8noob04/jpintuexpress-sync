"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import ThemeToggle from "./ThemeToggle";
import type { Profile } from "@/types";

const ROLE_HOME: Record<string, string> = {
  admin:       "/admin",
  aprobador:   "/aprobaciones",
  solicitante: "/solicitudes",
};

const ROLE_LABEL: Record<string, string> = {
  admin:       "Administrador",
  aprobador:   "Aprobador",
  solicitante: "Solicitante",
};

const ADMIN_NAV = [
  { title: "Dashboard",           href: "/admin",               exact: true,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { title: "Solicitudes",          href: "/admin/solicitudes",   exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { title: "Usuarios",             href: "/admin/usuarios",      exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { title: "Links de Aprobación",  href: "/admin/links",         exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
  { title: "Resets",               href: "/admin/resets",        exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg> },
  { title: "Informes",             href: "/admin/informes",      exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { title: "Prioridades",          href: "/admin/prioridades",   exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg> },
  { title: "Historial",            href: "/admin/historial",     exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: "Configuración",        href: "/admin/configuracion", exact: false,
    icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

interface NavbarProps {
  profile: Pick<Profile, "nombre_completo" | "email" | "role">;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname             = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef            = useRef<HTMLDivElement>(null);

  const isAdmin   = profile.role === "admin";
  const homeHref  = ROLE_HOME[profile.role] ?? "/dashboard";
  const initiales = (profile.nombre_completo ?? "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return;
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      <header className="glass-nav sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-3 hover:opacity-80 transition">
          <Image src="/logo.png" alt="J Pintuexpress S.A." width={68} height={68}
            className="object-contain rounded-xl" priority />
          <span className="font-bold text-gray-900 dark:text-gray-100 text-lg hidden sm:block tracking-tight">
            J Pintuexpress
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Desktop: nombre + rol */}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">
              {profile.nombre_completo}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </p>
          </div>

          <ThemeToggle />

          {/* Desktop: botón Salir (siempre visible en desktop) */}
          <form action={signOut} className="hidden sm:block">
            <button type="submit"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100
                         bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20
                         backdrop-blur-sm border border-white/70 dark:border-white/15
                         rounded-xl px-3 py-1.5 transition font-medium">
              Salir
            </button>
          </form>

          {/* ── MÓVIL ADMIN: botón hamburger ── */}
          {isAdmin && (
            <button onClick={() => setDrawerOpen(true)}
              className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5
                         rounded-xl bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/15
                         backdrop-blur-sm transition active:scale-95"
              aria-label="Abrir menú">
              <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full" />
              <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full" />
              <span className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 rounded-full" />
            </button>
          )}

          {/* ── MÓVIL NO-ADMIN: avatar con dropdown ── */}
          {!isAdmin && (
            <div ref={avatarRef} className="sm:hidden relative">
              <button onClick={() => setAvatarOpen(v => !v)}
                className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-black
                           flex items-center justify-center shadow-sm active:scale-95 transition">
                {initiales}
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-11 w-56 bg-white dark:bg-gray-900
                                border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl
                                overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Info usuario */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug truncate">
                      {profile.nombre_completo}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {ROLE_LABEL[profile.role] ?? profile.role}
                    </p>
                  </div>

                  {/* Nav links for aprobador */}
                  {profile.role === "aprobador" && (
                    <div className="px-3 pt-2 pb-1 space-y-0.5">
                      <Link href="/aprobaciones"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                                   text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Pendientes
                      </Link>
                      <Link href="/aprobaciones/historial"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
                                   text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mi historial
                      </Link>
                    </div>
                  )}

                  {/* Spacer visual — logout queda abajo separado */}
                  <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
                      ¿Deseas cerrar sesión?
                    </p>
                  </div>

                  <div className="px-3 pb-3">
                    <form action={signOut}>
                      <button type="submit"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5
                                   text-sm font-semibold text-red-600 dark:text-red-400
                                   bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30
                                   border border-red-200 dark:border-red-800/40
                                   rounded-xl transition active:scale-95">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── DRAWER ADMIN MÓVIL ─────────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className={`sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200
              ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          />

          {/* Drawer panel */}
          <div className={`sm:hidden fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw]
            bg-white dark:bg-gray-950 shadow-2xl flex flex-col
            transition-transform duration-300 ease-out
            ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>

            {/* Header del drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {profile.nombre_completo}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Administrador</p>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-2 mb-2">
                Administración
              </p>
              {ADMIN_NAV.map(item => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-