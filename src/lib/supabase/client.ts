import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el NAVEGADOR (componentes con "use client").
 * Se usa cuando necesitamos interactuar con Supabase desde el lado del cliente:
 * formularios reactivos, suscripciones en tiempo real, etc.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
