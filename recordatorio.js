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
    return '<tr><td colspan="5" bgcolor="#0f172a" style="padding:24px;text-align:center;color:#64748b;font-size:14px;background-color:#0f172a;">Sin solicitudes prioritarias</td></tr>';
  }
  return solicitudes.map(function(r, i) {
    var linkUrl = r.token_aprobacion
      ? APP_URL + "/aprobar/" + r.token_aprobacion
      : APP_URL + "/aprobaciones";
    var prioColor = getPrioridadColor(r.prioridad && r.prioridad.nombre);
    var prioLabel = (r.prioridad && r.prioridad.nombre) ? r.prioridad.nombre : "—";
    var rowBg = i % 2 === 0 ? "#0f172a" : "#111827";
    return (
      '<tr>' +
        '<td bgcolor="' + rowBg + '" style="padding:14px 16px;font-size:13px;color:#ffffff;border-bottom:1px solid #1e293b;background-color:' + rowBg + ';">' + (r.motivo || "—") + '</td>' +
        '<td bgcolor="' + rowBg + '" style="padding:14px 16px;font-size:13px;color:#cbd5e1;border-bottom:1px solid #1e293b;background-color:' + rowBg + ';">' + (r.solicitante && r.solicitante.nombre_completo ? r.solicitante.nombre_completo : "—") + '</td>' +
        '<td bgcolor="' + rowBg + '" style="padding:14px 16px;font-size:13px;color:#ffffff;border-bottom:1px solid #1e293b;white-space:nowrap;background-color:' + rowBg + ';">' + formatCurrency(r.costo_estimado) + '</td>' +
        '<td bgcolor="' + rowBg + '" style="padding:14px 16px;font-size:13px;color:' + prioColor + ';border-bottom:1px solid #1e293b;white-space:nowrap;background-color:' + rowBg + ';">&#9679; ' + prioLabel + '</td>' +
        '<td bgcolor="' + rowBg + '" style="padding:14px 16px;text-align:center;border-bottom:1px solid #1e293b;background-color:' + rowBg + ';">' +
          '<a href="' + linkUrl + '" style="background-color:#2563eb;color:#ffffff;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;display:inline-block;">Ver &#8594;</a>' +
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

  const ultima = solicitudes[solicitudes.length - 1];
  const ctaUrl = ultima && ultima.token_aprobacion
    ? APP_URL + "/aprobar/" + ultima.token_aprobacion
    : APP_URL + "/aprobaciones";

  const destacadas = solicitudes.filter(function(r) {
    var nivel = r.prioridad && r.prioridad.nivel ? r.prioridad.nivel : 0;
    return nivel <= 2 && nivel > 0;
  });

  const tablaItems = destacadas.length > 0 ? destacadas : solicitudes;
  const now = new Date().toLocaleString("es-PA", { timeZone: "America/Panama", dateStyle: "full", timeStyle: "short" });

  const html =
'<!DOCTYPE html>' +
'<html lang="es" xmlns="http://www.w3.org/1999/xhtml">' +
'<head>' +
'<meta charset="UTF-8"/>' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0"/>' +
'<meta name="color-scheme" content="dark"/>' +
'<meta name="supported-color-schemes" content="dark"/>' +
'<title>Recordatorio de solicitudes</title>' +
'</head>' +
'<body style="margin:0;padding:0;background-color:#050816;" bgcolor="#050816">' +

'<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#050816" style="background-color:#050816;padding:32px 16px;">' +
'<tr><td align="center">' +

  '<!-- CONTENEDOR -->' +
  '<table width="620" cellpadding="0" cellspacing="0" border="0" style="width:620px;max-width:620px;">' +

    '<!-- HEADER -->' +
    '<tr>' +
      '<td bgcolor="#1d4ed8" style="background-color:#1d4ed8;padding:28px 36px;border-radius:16px 16px 0 0;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
          '<td>' +
            '<div style="font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;">J Pintuexpress</div>' +
            '<div style="margin-top:6px;font-size:14px;color:#bfdbfe;">Recordatorio de solicitudes pendientes</div>' +
          '</td>' +
          '<td align="right" valign="middle">' +
            '<div style="font-size:32px;line-height:1;">&#128203;</div>' +
          '</td>' +
        '</tr></table>' +
      '</td>' +
    '</tr>' +

    '<!-- BODY -->' +
    '<tr>' +
      '<td bgcolor="#0b1220" style="background-color:#0b1220;padding:32px 36px;">' +

        '<div style="font-size:12px;color:#64748b;margin-bottom:24px;">' + now + '</div>' +

        '<!-- STATS -->' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +

          '<td width="47%" valign="top">' +
            '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1e293b;border-radius:12px;">' +
              '<tr><td bgcolor="#0f172a" style="background-color:#0f172a;padding:24px 16px;text-align:center;border-radius:12px;">' +
                '<div style="font-size:40px;font-weight:bold;color:#ffffff;line-height:1;">' + total + '</div>' +
                '<div style="margin-top:8px;font-size:13px;color:#64748b;">Solicitudes pendientes</div>' +
              '</td></tr>' +
            '</table>' +
          '</td>' +

          '<td width="6%"></td>' +

          '<td width="47%" valign="top">' +
            '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1e293b;border-radius:12px;">' +
              '<tr><td bgcolor="#0f172a" style="background-color:#0f172a;padding:24px 16px;text-align:center;border-radius:12px;">' +
                '<div style="font-size:26px;font-weight:bold;color:#34d399;line-height:1;">' + formatCurrency(totalValor) + '</div>' +
                '<div style="margin-top:8px;font-size:13px;color:#64748b;">Valor total pendiente</div>' +
              '</td></tr>' +
            '</table>' +
          '</td>' +

        '</tr></table>' +

        '<!-- TITULO TABLA -->' +
        '<div style="margin-top:32px;margin-bottom:14px;font-size:18px;font-weight:bold;color:#ffffff;">&#9889; Solicitudes prioritarias</div>' +

        '<!-- TABLA -->' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #1e293b;border-radius:12px;">' +
          '<tr bgcolor="#111827" style="background-color:#111827;">' +
            '<th align="left" bgcolor="#111827" style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;background-color:#111827;">Descripci&#243;n</th>' +
            '<th align="left" bgcolor="#111827" style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;background-color:#111827;">Solicitante</th>' +
            '<th align="left" bgcolor="#111827" style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;background-color:#111827;">Valor</th>' +
            '<th align="left" bgcolor="#111827" style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;background-color:#111827;">Prioridad</th>' +
            '<th align="left" bgcolor="#111827" style="padding:12px 16px;font-size:12px;color:#94a3b8;font-weight:600;border-bottom:1px solid #1e293b;background-color:#111827;">Acci&#243;n</th>' +
          '</tr>' +
          buildRows(tablaItems) +
        '</table>' +

        '<!-- CTA -->' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;"><tr><td align="center">' +
          '<a href="' + ctaUrl + '" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:14px 32px;font-size:15px;font-weight:bold;border-radius:10px;">Ver &#250;ltima solicitud &#8594;</a>' +
        '</td></tr></table>' +

      '</td>' +
    '</tr>' +

    '<!-- FOOTER -->' +
    '<tr>' +
      '<td bgcolor="#0b1220" style="background-color:#0b1220;padding:20px 36px;border-top:1px solid #1e293b;border-radius:0 0 16px 16px;text-align:center;">' +
        '<div style="font-size:12px;color:#475569;line-height:1.6;">Este es un mensaje autom&#225;tico del sistema interno de solicitudes.<br/>No respondas a este correo.</div>' +
      '</td>' +
    '</tr>' +

  '</table>' +

'</td></tr></table>' +
'</body></html>';

  const token = await getToken();
  await sendMail(token, toEmail, "📋 Tienes " + total + " solicitudes pendientes — J Pintuexpress", html);
  console.log("Correo enviado correctamente a " + toEmail);
}

main().catch(function(err) {
  console.error("Error: " + err.message);
  process.exit(1);
});
