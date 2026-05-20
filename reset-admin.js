// Script para resetear la contrasena del admin
// Ejecutar: node reset-admin.js
const { createClient } = require("@supabase/supabase-js");

const SUPA_URL = "https://yiahavtmeappginyyyjp.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYWhhdnRtZWFwcGdpbnl5eWpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIwODQ0NSwiZXhwIjoyMDkzNzg0NDQ1fQ.rj_Rc_Dq8GKueCKdCzAYbLz8rb08rU0dR9Ix8NOn-TM";
const NUEVA_CONTRASENA = "Admin2026!";

const supabase = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Buscando usuarios admin...");

  // 1. Obtener el id del admin desde profiles
  const { data: profiles, error: perr } = await supabase
    .from("profiles")
    .select("id, nombre_completo, email")
    .eq("role", "admin");

  if (perr) { console.error("Error buscando profiles:", perr.message); process.exit(1); }
  if (!profiles || profiles.length === 0) { console.log("No se encontraron admins."); process.exit(1); }

  console.log("\nAdmins encontrados:");
  profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p.nombre_completo} — ${p.email} (id: ${p.id})`));

  // 2. Resetear contrasena de cada admin
  for (const p of profiles) {
    const { error } = await supabase.auth.admin.updateUserById(p.id, {
      password: NUEVA_CONTRASENA
    });
    if (error) {
      console.error(`\nError reseteando ${p.email}:`, error.message);
    } else {
      console.log(`\n✅ Contrasena reseteada para: ${p.email}`);
      console.log(`   Nueva contrasena: ${NUEVA_CONTRASENA}`);
    }
  }
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
