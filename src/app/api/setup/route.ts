import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Ruta de migracion automatica - ejecutar UNA VEZ visitando:
// https://pagina-de-compras-para-jpintuexpres.vercel.app/api/setup
// Luego puedes eliminar este archivo.

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  const results: string[] = [];

  // Agregar telefono a profiles
  const { error: e1 } = await supabase.rpc("exec_sql" as any, {
    sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono TEXT;"
  }).maybeSingle();

  // Si exec_sql no existe, intentar via REST directamente con service role
  if (e1) {
    results.push("exec_sql no disponible: " + e1.message);
    results.push("Ejecuta manualmente en Supabase SQL Editor:");
    results.push("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono TEXT;");
  } else {
    results.push("telefono columna agregada a profiles OK");
  }

  return NextResponse.json({ ok: true, results });
}
