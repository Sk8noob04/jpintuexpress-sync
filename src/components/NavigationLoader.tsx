"use client";

// NavigationLoader desactivado — en móvil generaba bugs de hidratación.
// Next.js maneja loading state vía app/loading.tsx (React Suspense).
export default function NavigationLoader() {
  return null;
}
