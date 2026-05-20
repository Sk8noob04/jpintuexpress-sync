// recordatorio.js - Recordatorio diario al aprobador via Microsoft Graph
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SENDER = "alexander.castro@soltranes.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getToken() {
  const res = await fetch(
    "https://login.microsoftonline.com/" + TENANT_ID + "/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Token error: " + JSON.stringify(data));
  return data.access_token;
}

async function sendMail(token, toEmail, subject, htmlBody) {
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/users/" + SENDER + "/sendMail",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: { contentType: "HTML", content: htmlBody },
          toRecipients: [{ emailAddress: { address: toEmail } }],
        },
        saveToSentItems: false,
      }),
    }
  );
  if (!res.ok && res.status !== 202) {
    const err = await res.text();
    throw new Error("sendMail error: " + err);
  }
}

function formatCurrency(val) {
  return "$" + Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPrioridadLabel(nombre) {
  if (!nombre) return "";
  const n = nombre.toLowerCase();
  if (n.includes("alta") || n.includes("urgente") || n.includes("critica")) return "🔴 " + nombre;
  if (n.includes("media")) return "🟡 " + nombre;
  return nombre;
}

async function main() {
  console.log("Recordatorio Aprobador - " + new Date().toISOString());

  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_aprobador")
    .single();

  const toEmail = setting?.value;
  if (!toEmail) {
    console.log("No hay email_aprobador configurado. Saliendo.");
    return;
  }
  console.log("Enviando recordatorio a: " + toEmail);

  const { data: solicitudes, error } = await supabase
    .from("solicitudes")
    .select("id, motivo, costo_estimado, created_at, prioridad:prioridades(nombre, nivel), solicitante:profiles!solicitante_id(nombre_completo)")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) throw new Error("Supabase error: " + error.message);

  const total = solicitudes.length;
  const totalValor = solicitudes.reduce((s, r) => s + (r.costo_estimado || 0), 0);

  if (total === 0) {
    console.log("No hay solicitudes pendientes. No se envia correo.");
    return;
  }

  const destacadas = solicitudes.filter(r => {
    const nivel = r.prioridad?.nivel || 0;
    return nivel >= 2;
  });

  const now = new Date().toLocaleString("es-PA", { timeZone: "America/Panama", dateStyle: "full", timeStyle: "short" });

  let destacadasHtml = "";
  if (destacadas.length > 0) {
    destacadasHtml = "<h3 style=\"color:#b45309;margin:24px 0 12px;\">⚠️ Solicitudes prioritarias</h3><table style=\"width:100%;border-collapse:collapse;font-size:14px;\"><thead><tr style=\"background:#fef3c7;text-align:left;\"><th style=\"padding:8px 12px;border:1px solid #fde68a;\">Descripción</th><th style=\"padding:8px 12px;border:1px solid #fde68a;\">Solicitante</th><th style=\"padding:8px 12px;border:1px solid #fde68a;\">Valor</th><th style=\"padding:8px 12px;border:1px solid #fde68a;\">Prioridad</th></tr></thead><tbody>" +
      destacadas.map((r, i) =>
        "<tr style=\"background:" + (i % 2 === 0 ? "#fff" : "#fffbeb") + ";\"><td style=\"padding:8px 12px;border:1px solid #fde68a;\">" + (r.motivo || "") + "</td><td style=\"padding:8px 12px;border:1px solid #fde68a;\">" + (r.solicitante?.nombre_completo || "") + "</td><td style=\"padding:8px 12px;border:1px solid #fde68a;\">" + formatCurrency(r.costo_estimado) + "</td><td style=\"padding:8px 12px;border:1px solid #fde68a;\">" + getPrioridadLabel(r.prioridad?.nombre) + "</td></tr>"
      ).join("") +
      "</tbody></table>";
  }

  const html = "<div style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;\"><div style=\"background:#1d4ed8;color:white;padding:24px 32px;border-radius:12px 12px 0 0;\"><h1 style=\"margin:0;font-size:20px;\">📋 J Pintuexpress</h1><p style=\"margin:6px 0 0;opacity:0.85;font-size:14px;\">Recordatorio de solicitudes pendientes</p></div><div style=\"background:#f8fafc;padding:24px 32px;border:1px solid #e2e8f0;border-top:none;\"><p style=\"color:#64748b;font-size:13px;margin:0 0 20px;\">" + now + "</p><div style=\"display:flex;gap:16px;margin-bottom:24px;\"><div style=\"flex:1;background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;\"><div style=\"font-size:32px;font-weight:700;color:#1d4ed8;\">" + total + "</div><div style=\"font-size:13px;color:#64748b;margin-top:4px;\">Solicitudes pendientes</div></div><div style=\"flex:1;background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;\"><div style=\"font-size:24px;font-weight:700;color:#059669;\">" + formatCurrency(totalValor) + "</div><div style=\"font-size:13px;color:#64748b;margin-top:4px;\">Valor total pendiente</div></div></div>" + destacadasHtml + "<div style=\"margin-top:28px;text-align:center;\"><a href=\"https://jpintuexpress.vercel.app/aprobaciones\" style=\"background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;\">Ver solicitudes →</a></div></div><div style=\"background:#f1f5f9;padding:12px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;\"><p style=\"margin:0;font-size:12px;color:#94a3b8;text-align:center;\">J Pintuexpress — Sistema de compras</p></div></div>";

  const token = await getToken();
  await sendMail(token, toEmail, "📋 Tienes " + total + " solicitudes pendientes — J Pintuexpress", html);
  console.log("Correo enviado correctamente a " + toEmail);
}

main().catch(err => {
  console.error("Error: " + err.message);
  process.exit(1);
});
