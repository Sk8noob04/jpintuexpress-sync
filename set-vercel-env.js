/**
 * set-vercel-env.js
 * Configura las variables de entorno en Vercel para jpintuexpress.
 * Ejecutar desde Windows con: node set-vercel-env.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Configuración ────────────────────────────────────────────────────────────
const TOKEN_FILE = path.join(
  process.env.APPDATA || "",
  "com.vercel.cli",
  "Data",
  "auth.json"
);

let TOKEN = "";
try {
  const auth = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  TOKEN = auth.token || "";
} catch {
  console.error("No se pudo leer el token de Vercel en:", TOKEN_FILE);
  process.exit(1);
}

const PROJECT_ID = "prj_muAGVwHuFeX1GWRhErfIeAWM9LoV";
const TEAM_ID = "team_1gXGJZ6i2OJp1SYi5KLBrzLM";

// Variables que deben estar en producción
const REQUIRED_ENV = [
  {
    key: "WA_SERVER_URL",
    value: "https://overstock-flagstick-ploy.ngrok-free.dev",
    target: ["production"],
  },
  {
    key: "WA_SECRET",
    value: "jpintuexpress2026",
    target: ["production"],
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    value: "https://jpintuexpress.vercel.app",
    target: ["production"],
  },
];

// ── Helpers HTTP ─────────────────────────────────────────────────────────────
function apiRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.vercel.com",
      path: urlPath + (TEAM_ID ? `?teamId=${TEAM_ID}` : ""),
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n=== Configurando variables de entorno en Vercel ===\n");

  // 1. Obtener vars actuales
  const listRes = await apiRequest("GET", `/v9/projects/${PROJECT_ID}/env`);
  if (listRes.status !== 200) {
    console.error("Error al listar env vars:", listRes.body);
    process.exit(1);
  }

  const existing = listRes.body.envs || [];
  console.log(`Variables actuales en Vercel (${existing.length} total):`);
  existing.forEach((e) => console.log(`  ${e.key} [${e.target?.join(",")}]`));
  console.log();

  // 2. Upsert cada variable requerida
  for (const envVar of REQUIRED_ENV) {
    const found = existing.find(
      (e) => e.key === envVar.key && e.target?.includes("production")
    );

    if (found) {
      // Actualizar
      const res = await apiRequest(
        "PATCH",
        `/v9/projects/${PROJECT_ID}/env/${found.id}`,
        { value: envVar.value, target: envVar.target }
      );
      if (res.status === 200) {
        console.log(`✅ ACTUALIZADO: ${envVar.key} = ${envVar.value}`);
      } else {
        console.error(`❌ Error actualizando ${envVar.key}:`, res.body);
      }
    } else {
      // Crear
      const res = await apiRequest(
        "POST",
        `/v10/projects/${PROJECT_ID}/env`,
        [{ key: envVar.key, value: envVar.value, target: envVar.target, type: "plain" }]
      );
      if (res.status === 201 || res.status === 200) {
        console.log(`✅ CREADO:     ${envVar.key} = ${envVar.value}`);
      } else {
        console.error(`❌ Error creando ${envVar.key}:`, JSON.stringify(res.body, null, 2));
      }
    }
  }

  console.log("\n=== Listo. Ahora ejecuta 'vercel --prod' para redesplegar. ===\n");
}

main().catch((err) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
