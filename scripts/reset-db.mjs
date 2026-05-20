/**
 * reset-db.mjs — JPintuexpress
 * Limpia todos los datos de prueba:
 *   1. Imágenes en Storage (bucket solicitudes-imagenes)
 *   2. Tabla solicitudes
 *   3. Tabla profiles (excepto admin)
 *   4. auth.users (excepto admin)
 *
 * Uso: node scripts/reset-db.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yiahavtmeappginyyyjp.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYWhhdnRtZWFwcGdpbnl5eWpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIwODQ0NSwiZXhwIjoyMDkzNzg0NDQ1fQ.rj_Rc_Dq8GKueCKdCzAYbLz8rb08rU0dR9Ix8NOn-TM";
const ADMIN_EMAIL = "sk8noob04@gmail.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// ─── 1. Limpiar Storage ───────────────────────────────────────────────────────
async function limpiarStorage() {
  log("📦 PASO 1: Limpiando bucket solicitudes-imagenes...");
  let totalBorrados = 0;
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from("solicitudes-imagenes")
      .list("", { limit: pageSize, offset });

    if (error) { log(`  ⚠️  Error listando archivos: ${error.message}`); break; }
    if (!files || files.length === 0) break;

    // Los archivos están en carpetas por user_id, necesitamos listar recursivamente
    const paths = files.map(f => f.name);

    // Si son carpetas (sin extensión), listar su contenido
    const filePaths = [];
    for (const item of files) {
      if (!item.name.includes(".")) {
        // Es una carpeta, listar contenido
        const { data: inner } = await supabase.storage
          .from("solicitudes-imagenes")
          .list(item.name, { limit: 1000 });
        if (inner) {
          inner.forEach(f => filePaths.push(`${item.name}/${f.name}`));
        }
      } else {
        filePaths.push(item.name);
      }
    }

    if (filePaths.length > 0) {
      const { error: delError } = await supabase.storage
        .from("solicitudes-imagenes")
        .remove(filePaths);
      if (delError) { log(`  ⚠️  Error borrando archivos: ${delError.message}`); }
      else { totalBorrados += filePaths.length; log(`  ✓ Borrados ${filePaths.length} archivos`); }
    }

    if (files.length < pageSize) break;
    offset += pageSize;
  }

  log(`  ✅ Storage limpio. Total archivos borrados: ${totalBorrados}`);
}

// ─── 2. Borrar solicitudes ────────────────────────────────────────────────────
async function borrarSolicitudes() {
  log("📋 PASO 2: Borrando todas las solicitudes...");
  const { count, error } = await supabase
    .from("solicitudes")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // condición siempre true

  if (error) { log(`  ❌ Error: ${error.message}`); return; }
  log(`  ✅ Solicitudes borradas: ${count ?? "todas"}`);
}

// ─── 3. Borrar profiles (excepto admin) ──────────────────────────────────────
async function borrarProfiles(adminId) {
  log("👤 PASO 3: Borrando profiles (excepto admin)...");
  const { count, error } = await supabase
    .from("profiles")
    .delete({ count: "exact" })
    .neq("id", adminId);

  if (error) { log(`  ❌ Error: ${error.message}`); return; }
  log(`  ✅ Profiles borrados: ${count ?? "todos los no-admin"}`);
}

// ─── 4. Borrar usuarios de auth (excepto admin) ───────────────────────────────
async function borrarAuthUsers(adminId) {
  log("🔐 PASO 4: Borrando usuarios de Supabase Auth (excepto admin)...");

  let page = 1;
  let totalBorrados = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (error) { log(`  ❌ Error listando usuarios: ${error.message}`); break; }

    const users = data?.users ?? [];
    if (users.length === 0) { hasMore = false; break; }

    for (const user of users) {
      if (user.id === adminId) {
        log(`  ⏭  Saltando admin: ${user.email}`);
        continue;
      }
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) { log(`  ⚠️  Error borrando ${user.email}: ${delErr.message}`); }
      else { log(`  ✓ Borrado: ${user.email}`); totalBorrados++; }
    }

    hasMore = data.nextPage != null;
    page++;
  }

  log(`  ✅ Usuarios auth borrados: ${totalBorrados}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n==========================================");
  console.log("  RESET DE BASE DE DATOS — JPintuexpress");
  console.log("==========================================\n");

  // Obtener ID del admin
  log("🔍 Buscando ID del admin...");
  const { data: adminProfile, error: adminErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", ADMIN_EMAIL)
    .single();

  if (adminErr || !adminProfile) {
    console.error("❌ No se encontró el perfil del admin. Abortando.");
    console.error(adminErr?.message);
    process.exit(1);
  }

  log(`  ✅ Admin encontrado: ${adminProfile.email} (id: ${adminProfile.id}, role: ${adminProfile.role})`);

  await limpiarStorage();
  await borrarSolicitudes();
  await borrarProfiles(adminProfile.id);
  await borrarAuthUsers(adminProfile.id);

  console.log("\n==========================================");
  console.log("  ✅ RESET COMPLETADO");
  console.log("==========================================\n");
}

main().catch(err => { console.error("Error fatal:", err); process.exit(1); });
