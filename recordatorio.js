// recordatorio.js - Recordatorio diario al aprobador via Microsoft Graph
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SENDER = "alexander.castro@soltranes.com";
const APP_URL = "https://pagina-de-compras-para-jpintuexpres.vercel.app";

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

function getPrioridadColor(nombre) {
  if (!nombre) return "#94a3b8";
  const n = nombre.toLowerCase();
  if (n.includes("alta") || n.includes("urgente") || n.includes("critica")) return "#f87171";
  if (n.includes("media")) return "#fbbf24";
  return "#94a3b8";
}

function buildRows(solicitudes) {
  if (!solicitudes || solicitudes.length === 0) {
    return '<tr><td colspan="5" style="padding:24px;text-align:center;color:#64748b;font-size:14px;">No hay solicitudes prioritarias</td></tr>';
  }
  return solicitudes.map(function(r) {
    var linkUrl = r.token_aprobacion
      ? APP_URL + "/aprobar/" + r.token_aprobacion
      : APP_URL + "/aprobaciones";
    var prioColor = getPrioridadColor(r.prioridad && r.prioridad.nombre);
    var prioLabel = (r.prioridad && r.prioridad.nombre) ? r.prioridad.nombre : "—";
    return (
      '<tr>' +
        '<td style="padding:18px 16px;font-size:14px;color:#ffffff;border-bottom:1px solid #1e293b;">' + (r.motivo || "—") + '</td>' +
        '<td style="padding:18px 16px;font-size:14px;color:#cbd5e1;border-bottom:1px solid #1e293b;">' + (r.solicitante && r.solicitante.nombre_completo ? r.solicitante.nombre_completo : "—") + '</td>' +
        '<td style="padding:18px 16px;font-size:14px;color:#ffffff;border-bottom:1px solid #1e293b;">' + formatCurrency(r.costo_estimado) + '</td>' +
        '<td style="padding:18px 16px;font-size:14px;color:' + prioColor + ';border-bottom:1px solid #1e293b;">&#9679; ' + prioLabel + '</td>' +
        '<td style="padding:18px 16px;font-size:14px;border-bottom:1px solid #1e293b;text-align:center;">' +
          '<a href="' + linkUrl + '" style="background:#2563eb;color:#ffffff;padding:6px 14px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;">Ver &rarr;</a>' +
        '</td>' +
      '</tr>'
    );
  }).join("");
}

async function main() {
  console.log("Recordatorio Aprobador - " + new Date().toISOString());

  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "email_aprobador")
    .single();

  const toEmail = setting && setting.value;
  if (!toEmail) {
    console.log("No hay email_aprobador configurado. Saliendo.");
    return;
  }
  console.log("Enviando recordatorio a: " + toEmail);

  const { data: solicitudes, error } = await supabase
    .from("solicitudes")
    .select("id, motivo, costo_estimado, created_at, token_aprobacion, prioridad:prioridades(nombre, nivel), solicitante:profiles!solicitante_id(nombre_completo)")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error) throw new Error("Supabase error: " + error.message);

  const total = solicitudes.length;
  const totalValor = solicitudes.reduce(function(s, r) { return s + (r.costo_estimado || 0); }, 0);

  if (total === 0) {
    console.log("No hay solicitudes pendientes. No se envia correo.");
    return;
  }

  // Última solicitud para CTA
  const ultima = solicitudes[solicitudes.length - 1];
  const ctaUrl = ultima && ultima.token_aprobacion
    ? APP_URL + "/aprobar/" + ultima.token_aprobacion
    : APP_URL + "/aprobaciones";

  // Solicitudes prioritarias (nivel > 0 y <= 2)
  const destacadas = solicitudes.filter(function(r) {
    var nivel = r.prioridad && r.prioridad.nivel ? r.prioridad.nivel : 0;
    return nivel <= 2 && nivel > 0;
  });

  // Mostrar prioritarias si hay, sino todas
  const tablaItems = destacadas.length > 0 ? destacadas : solicitudes;

  const now = new Date().toLocaleString("es-PA", { timeZone: "America/Panama", dateStyle: "full", timeStyle: "short" });

  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>' +
'<body style="margin:0;padding:0;background:#050816;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">' +
'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050816;padding:40px 20px;">' +
'<tr><td align="center">' +

'<table width="650" cellpadding="0" cellspacing="0" border="0" style="width:650px;max-width:650px;background:#0b1220;border:1px solid #1f2937;border-radius:20px;overflow:hidden;">' +

'<!-- HEADER -->' +
'<tr><td style="padding:32px 40px;background:linear-gradient(90deg,#1d4ed8,#2563eb);">' +
  '<div style="font-size:28px;font-weight:bold;letter-spacing:-1px;color:#ffffff;">J Pintuexpress</div>' +
  '<div style="margin-top:8px;font-size:15px;color:rgba(255,255,255,0.85);">Recordatorio de solicitudes pendientes</div>' +
'</td></tr>' +

'<!-- BODY -->' +
'<tr><td style="padding:40px;">' +

  '<div style="font-size:13px;color:#94a3b8;margin-bottom:28px;">' + now + '</div>' +

  '<!-- STATS -->' +
  '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td width="48%" valign="top">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;">' +
        '<tr><td style="padding:28px;text-align:center;">' +
          '<div style="font-size:42px;font-weight:bold;color:#ffffff;">' + total + '</div>' +
          '<div style="margin-top:8px;font-size:14px;color:#94a3b8;">Solicitudes pendientes</div>' +
        '</td></tr>' +
      '</table>' +
    '</td>' +
    '<td width="4%"></td>' +
    '<td width="48%" valign="top">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;">' +
        '<tr><td style="padding:28px;text-align:center;">' +
          '<div style="font-size:32px;font-weight:bold;color:#34d399;">' + formatCurrency(totalValor) + '</div>' +
          '<div style="margin-top:8px;font-size:14px;color:#94a3b8;">Valor total pendiente</div>' +
        '</td></tr>' +
      '</table>' +
    '</td>' +
  '</tr></table>' +

  '<!-- TABLA -->' +
  '<div style="margin-top:40px;margin-bottom:18px;font-size:22px;font-weight:bold;color:#ffffff;">&#9889; Solicitudes prioritarias</div>' +

  '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;overflow:hidden;border-radius:14px;background:#0f172a;border:1px solid #1e293b;">' +
    '<tr style="background:#111827;">' +
      '<th align="left" style="padding:16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;">Descripci&oacute;n</th>' +
      '<th align="left" style="padding:16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;">Solicitante</th>' +
      '<th align="left" style="padding:16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;">Valor</th>' +
      '<th align="left" style="padding:16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;">Prioridad</th>' +
      '<th align="left" style="padding:16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;">Acci&oacute;n</th>' +
    '</tr>' +
    buildRows(tablaItems) +
  '</table>' +

  '<!-- CTA -->' +
  '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">' +
    '<a href="' + ctaUrl + '" style="display:inline-block;margin-top:36px;background:linear-gradient(90deg,#2563eb,#3b82f6);color:#ffffff;text-decoration:none;padding:16px 34px;font-size:15px;font-weight:bold;border-radius:12px;">Ver &uacute;ltima solicitud &rarr;</a>' +
  '</td></tr></table>' +

'</td></tr>' +

'<!-- FOOTER -->' +
'<tr><td style="padding:24px 40px;border-top:1px solid #1e293b;text-align:center;">' +
  '<div style="font-size:12px;color:#64748b;line-height:1.6;">Este es un mensaje autom&aacute;tico del sistema interno de solicitudes.<br>No respondas a este correo.</div>' +
'</td></tr>' +

'</table>' +
'</td></tr></table></body></html>';

  const token = await getToken();
  await sendMail(token, toEmail, "📋 Tienes " + total + " solicitudes pendientes — J Pintuexpress", html);
  console.log("Correo enviado correctamente a " + toEmail);
}

main().catch(function(err) {
  console.error("Error: " + err.message);
  process.exit(1);
});
