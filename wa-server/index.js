require("dotenv").config();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode  = require("qrcode-terminal");
const express = require("express");
const fs      = require("fs");

// ─── Configuracion ────────────────────────────────────────────────────────────
const PORT      = process.env.PORT      || 3001;
const WA_SECRET = process.env.WA_SECRET || "jpintuexpress2026";
const TEST_MODE = process.env.TEST_MODE !== "false";
const TEST_NUM  = process.env.TEST_NUMBER || "";
const JEFE_NUM  = process.env.JEFE_NUMBER || "";

// Rutas posibles de Chrome en Windows
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.CHROME_PATH || "",
].filter(Boolean);

function getChromePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  console.error("[WA] ADVERTENCIA: Chrome no encontrado. Rutas:", CHROME_PATHS);
  return CHROME_PATHS[0];
}

// ─── Estado ───────────────────────────────────────────────────────────────────
let waReady       = false;
let client        = null;
let reconnectTimer = null;
let readyTimeout  = null;

function formatNum(raw) {
  return raw.replace(/\D/g, "") + "@c.us";
}

function resolveRecipient(recipientRaw) {
  if (TEST_MODE) {
    if (!TEST_NUM) { console.warn("[WA] TEST_MODE activo pero TEST_NUMBER no configurado"); return null; }
    return formatNum(TEST_NUM);
  }
  if (!recipientRaw) return JEFE_NUM ? formatNum(JEFE_NUM) : null;
  return formatNum(recipientRaw);
}

// ─── Iniciar cliente WA ───────────────────────────────────────────────────────
function startWAClient() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (readyTimeout)   { clearTimeout(readyTimeout);   readyTimeout   = null; }

  // Destruir cliente anterior si existe
  if (client) {
    try { client.destroy(); } catch (_) {}
    client = null;
  }
  waReady = false;

  const chromePath = getChromePath();
  console.log(`\n[WA] Usando Chrome: ${chromePath}`);

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./wa-session" }),
    // Fijar version de WhatsApp Web para evitar incompatibilidades
    webVersionCache: {
      type: "remote",
      remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1023324965-alpha.html",
    },
    puppeteer: {
      headless: true,
      executablePath: chromePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--disable-translate",
        "--disable-features=TranslateUI",
        "--window-size=1280,800",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("\n======================================================");
    console.log("  ESCANEA ESTE QR CON WHATSAPP:");
    console.log("  Menu (3 puntos) > Dispositivos vinculados > Vincular");
    console.log("======================================================\n");
    qrcode.generate(qr, { small: true });
    console.log("\nEsperando escaneo...\n");
  });

  client.on("loading_screen", (percent, message) => {
    process.stdout.write(`\r[WA] Cargando... ${percent}% - ${message}      `);
  });

  client.on("authenticated", () => {
    console.log("\n[WA] Autenticado correctamente.");
    console.log("[WA] Cargando WhatsApp Web... (puede tardar 30-60 seg)");

    // Si en 90 segundos no llega el evento "ready", reiniciar
    readyTimeout = setTimeout(() => {
      console.error("\n[WA] ⚠ Timeout: el evento 'ready' no llego en 90 seg.");
      console.error("[WA] Posible incompatibilidad de version. Reiniciando...");
      startWAClient();
    }, 90_000);
  });

  client.on("ready", () => {
    if (readyTimeout) { clearTimeout(readyTimeout); readyTimeout = null; }
    waReady = true;
    const mode = TEST_MODE ? `PRUEBA -> ${TEST_NUM}` : "PRODUCCION";
    console.log(`\n[WA] ✓ CONECTADO! Modo: ${mode}`);
    console.log(`[WA] Escuchando en http://localhost:${PORT}`);
    console.log(`[WA] Health: http://localhost:${PORT}/health\n`);
  });

  client.on("auth_failure", (msg) => {
    if (readyTimeout) { clearTimeout(readyTimeout); readyTimeout = null; }
    console.error("\n[WA] Error de autenticacion:", msg);
    console.error("[WA] Ejecuta VINCULAR_WHATSAPP.bat para re-vincular.");
    waReady = false;
  });

  client.on("disconnected", (reason) => {
    if (readyTimeout) { clearTimeout(readyTimeout); readyTimeout = null; }
    console.warn(`\n[WA] Desconectado: ${reason}`);
    waReady = false;
    console.log("[WA] Reconectando en 8 segundos...");
    reconnectTimer = setTimeout(startWAClient, 8_000);
  });

  client.initialize().catch(err => {
    console.error("\n[WA] Error al inicializar:", err.message);
    console.log("[WA] Reintentando en 10 segundos...");
    reconnectTimer = setTimeout(startWAClient, 10_000);
  });
}

// ─── Express API ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const secret = req.headers["x-secret"] || req.query.secret;
  if (secret !== WA_SECRET) return res.status(401).json({ error: "No autorizado" });
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true, waReady, testMode: TEST_MODE, testNum: TEST_NUM || "(no configurado)", port: PORT });
});

app.post("/send", async (req, res) => {
  if (!waReady) {
    return res.status(503).json({ error: "WhatsApp no conectado todavia. Espera el mensaje [WA] ✓ CONECTADO en la terminal." });
  }
  const { to, message } = req.body;
  if (!message) return res.status(400).json({ error: "Falta 'message'" });

  const recipient = resolveRecipient(to);
  if (!recipient) return res.status(400).json({ error: "Sin numero destinatario" });

  try {
    await client.sendMessage(recipient, message);
    console.log(`[WA] Mensaje enviado a ${recipient}`);
    res.json({ ok: true, sentTo: recipient });
  } catch (err) {
    console.error("[WA] Error al enviar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Arrancar ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[WA] ============================================`);
  console.log(`[WA] Servidor en puerto ${PORT}`);
  console.log(`[WA] Modo: ${TEST_MODE ? `PRUEBA -> ${TEST_NUM || "SIN NUMERO"}` : "PRODUCCION"}`);
  console.log(`[WA] ============================================\n`);
});

startWAClient();
