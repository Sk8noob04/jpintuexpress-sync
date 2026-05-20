// ============================================================
// JPINTUEXPRESS — Sync Supabase → SharePoint Lists
// Corre cada 30 minutos via GitHub Actions
// ============================================================

const { createClient } = require("@supabase/supabase-js");

// ── Configuración ────────────────────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID         = process.env.AZURE_TENANT_ID;
const CLIENT_ID         = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET     = process.env.AZURE_CLIENT_SECRET;
const SHAREPOINT_URL    = process.env.SHAREPOINT_SITE_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Tablas a sincronizar ─────────────────────────────────────
const TABLES = [
  {
    tableName: "solicitudes",
    listName:  "Solicitudes de Compra",
    titleField: "motivo",
    select: "id, motivo, costo_estimado, estado, comentario_aprobador, imagen_url, placa, token_aprobacion, created_at, updated_at, linea:lineas(nombre), activo:activos(nombre), solicitante:profiles!solicitante_id(nombre_completo), aprobador:profiles!aprobador_id(nombre_completo)",
    flatten: (r) => ({
      id:                    r.id,
      motivo:                r.motivo,
      costo_estimado:        r.costo_estimado,
      estado:                r.estado,
      linea:                 r.linea ? r.linea.nombre : "",
      activo:                r.activo ? r.activo.nombre : "",
      solicitante:           r.solicitante ? r.solicitante.nombre_completo : "",
      aprobador:             r.aprobador ? r.aprobador.nombre_completo : "",
      comentario_aprobador:  r.comentario_aprobador || "",
      imagen_url:            r.imagen_url || "",
      placa:                 r.placa || "",
      token_aprobacion:      r.token_aprobacion || "",
      created_at:            r.created_at,
      updated_at:            r.updated_at,
    }),
    columns: [
      { name: "id",                   display: "ID",                   type: "text" },
      { name: "costo_estimado",       display: "Costo Estimado",       type: "number" },
      { name: "estado",               display: "Estado",               type: "text" },
      { name: "linea",                display: "Linea",                type: "text" },
      { name: "activo",               display: "Activo",               type: "text" },
      { name: "solicitante",          display: "Solicitante",          type: "text" },
      { name: "aprobador",            display: "Aprobador",            type: "text" },
      { name: "comentario_aprobador", display: "Comentario Aprobador", type: "text" },
      { name: "imagen_url",           display: "Imagen URL",           type: "text" },
      { name: "placa",                display: "Placa",                type: "text" },
      { name: "token_aprobacion",     display: "Token Aprobacion",     type: "text" },
      { name: "created_at",           display: "Fecha Creacion",       type: "text" },
      { name: "updated_at",           display: "Ultima Actualizacion", type: "text" },
    ],
  },
  {
    tableName: "profiles",
    listName:  "Usuarios",
    titleField: "nombre_completo",
    select: "id, nombre_completo, email, role, telefono, debe_cambiar_password, created_at, updated_at",
    flatten: (r) => ({
      id:                   r.id,
      nombre_completo:      r.nombre_completo,
      email:                r.email,
      role:                 r.role,
      telefono:             r.telefono || "",
      debe_cambiar_password: r.debe_cambiar_password ? "Si" : "No",
      created_at:           r.created_at,
      updated_at:           r.updated_at,
    }),
    columns: [
      { name: "id",                    display: "ID",                      type: "text" },
      { name: "email",                 display: "Email",                   type: "text" },
      { name: "role",                  display: "Rol",                     type: "text" },
      { name: "telefono",              display: "Telefono",                type: "text" },
      { name: "debe_cambiar_password", display: "Debe Cambiar Contrasena", type: "text" },
      { name: "created_at",            display: "Fecha Creacion",          type: "text" },
      { name: "updated_at",            display: "Ultima Actualizacion",    type: "text" },
    ],
  },
  {
    tableName: "lineas",
    listName:  "Lineas",
    titleField: "nombre",
    select: "id, nombre, activa, created_at",
    flatten: (r) => ({
      id:         r.id,
      nombre:     r.nombre,
      activa:     r.activa ? "Si" : "No",
      created_at: r.created_at,
    }),
    columns: [
      { name: "id",         display: "ID",             type: "text" },
      { name: "activa",     display: "Activa",         type: "text" },
      { name: "created_at", display: "Fecha Creacion", type: "text" },
    ],
  },
  {
    tableName: "activos",
    listName:  "Activos",
    titleField: "nombre",
    select: "id, nombre, activo, created_at, linea:lineas(nombre)",
    flatten: (r) => ({
      id:         r.id,
      nombre:     r.nombre,
      linea:      r.linea ? r.linea.nombre : "",
      activo:     r.activo ? "Si" : "No",
      created_at: r.created_at,
    }),
    columns: [
      { name: "id",         display: "ID",             type: "text" },
      { name: "linea",      display: "Linea",          type: "text" },
      { name: "activo",     display: "Activo",         type: "text" },
      { name: "created_at", display: "Fecha Creacion", type: "text" },
    ],
  },
  {
    tableName: "user_audit_log",
    listName:  "Auditoria de Usuarios",
    titleField: "accion",
    select: "id, accion, detalles, created_at, admin:profiles!admin_id(nombre_completo), usuario:profiles!usuario_id(nombre_completo)",
    flatten: (r) => ({
      id:         r.id,
      accion:     r.accion,
      admin:      r.admin ? r.admin.nombre_completo : "",
      usuario:    r.usuario ? r.usuario.nombre_completo : "",
      detalles:   JSON.stringify(r.detalles || {}),
      created_at: r.created_at,
    }),
    columns: [
      { name: "id",         display: "ID",            type: "text" },
      { name: "admin",      display: "Administrador", type: "text" },
      { name: "usuario",    display: "Usuario",       type: "text" },
      { name: "detalles",   display: "Detalles",      type: "text" },
      { name: "created_at", display: "Fecha",         type: "text" },
    ],
  },
];

// ── Microsoft Graph helpers ──────────────────────────────────

async function getToken() {
  const res = await fetch(
    "https://login.microsoftonline.com/" + TENANT_ID + "/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope:         "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Error obteniendo token: " + JSON.stringify(data));
  return data.access_token;
}

async function graph(token, method, path, body) {
  const res = await fetch("https://graph.microsoft.com/v1.0" + path, {
    method,
    headers: {
      Authorization:  "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  if (res.status === 200 && res.headers.get("content-length") === "0") return null;
  const data = await res.json();
  if (data.error) throw new Error("Graph " + method + " " + path + " -> " + data.error.code + ": " + data.error.message);
  return data;
}

async function getSiteId(token) {
  const url  = new URL(SHAREPOINT_URL);
  const host = url.hostname;
  const path = url.pathname;
  const data = await graph(token, "GET", "/sites/" + host + ":" + path);
  console.log("[SP] Site ID: " + data.id);
  return data.id;
}

async function getOrCreateList(token, siteId, displayName) {
  const lists = await graph(token, "GET", "/sites/" + siteId + "/lists?$select=id,displayName");
  const existing = lists.value.find(function(l) { return l.displayName === displayName; });
  if (existing) {
    console.log("[SP] Lista existente: \"" + displayName + "\" (" + existing.id + ")");
    return existing.id;
  }
  const created = await graph(token, "POST", "/sites/" + siteId + "/lists", {
    displayName: displayName,
    list: { template: "genericList" },
  });
  console.log("[SP] Lista creada: \"" + displayName + "\" (" + created.id + ")");
  return created.id;
}

async function ensureColumns(token, siteId, listId, columns) {
  const existing = await graph(token, "GET", "/sites/" + siteId + "/lists/" + listId + "/columns?$select=name");
  const existingNames = new Set(existing.value.map(function(c) { return c.name; }));

  for (const col of columns) {
    if (existingNames.has(col.name)) continue;
    const colDef = {
      name:        col.name,
      displayName: col.display,
    };
    if (col.type === "number") {
      colDef.number = { decimalPlaces: "two" };
    } else {
      colDef.text = { allowMultipleLines: false, maxLength: 500 };
    }
    try {
      await graph(token, "POST", "/sites/" + siteId + "/lists/" + listId + "/columns", colDef);
    } catch (e) {
      console.warn("[SP] Columna \"" + col.name + "\" ya existe o error: " + e.message);
    }
  }
}

async function clearAllItems(token, siteId, listId) {
  let nextLink = "/sites/" + siteId + "/lists/" + listId + "/items?$select=id&$top=500";
  let total = 0;
  while (nextLink) {
    const data = await graph(token, "GET", nextLink);
    const items = data.value;
    if (!items.length) break;
    for (let i = 0; i < items.length; i += 5) {
      const batch = items.slice(i, i + 5);
      await Promise.all(
        batch.map(function(item) {
          return graph(token, "DELETE", "/sites/" + siteId + "/lists/" + listId + "/items/" + item.id);
        })
      );
    }
    total += items.length;
    nextLink = data["@odata.nextLink"]
      ? data["@odata.nextLink"].replace("https://graph.microsoft.com/v1.0", "")
      : null;
  }
  console.log("[SP] Eliminados " + total + " items anteriores");
}

async function insertItems(token, siteId, listId, rows, titleField) {
  let inserted = 0;
  for (const row of rows) {
    const fields = {};
    fields.Title = String(row[titleField] || row.id || "Sin titulo").substring(0, 255);
    for (const key of Object.keys(row)) {
      if (key === titleField) continue;
      const val = row[key];
      if (val === null || val === undefined) continue;
      fields[key] = String(val).substring(0, 500);
    }
    try {
      await graph(token, "POST", "/sites/" + siteId + "/lists/" + listId + "/items", { fields: fields });
      inserted++;
    } catch (e) {
      console.warn("[SP] Error insertando item: " + e.message);
    }
  }
  console.log("[SP] Insertados " + inserted + " items");
}

// ── Lógica principal ─────────────────────────────────────────

async function syncTable(token, siteId, tableDef) {
  console.log("\n--- Sincronizando: " + tableDef.listName + " ---");

  const result = await supabase
    .from(tableDef.tableName)
    .select(tableDef.select)
    .order("created_at", { ascending: false });

  if (result.error) throw new Error("Supabase error en " + tableDef.listName + ": " + result.error.message);
  const rows = result.data.map(tableDef.flatten);
  console.log("[SB] " + rows.length + " filas obtenidas de Supabase");

  const listId = await getOrCreateList(token, siteId, tableDef.listName);
  await ensureColumns(token, siteId, listId, tableDef.columns);
  await clearAllItems(token, siteId, listId);
  await insertItems(token, siteId, listId, rows, tableDef.titleField);
}

async function main() {
  const start = new Date();
  console.log("\nJPintuexpress Sync - " + start.toISOString());
  console.log("--------------------------------------------------");

  try {
    const token  = await getToken();
    const siteId = await getSiteId(token);

    for (const table of TABLES) {
      await syncTable(token, siteId, table);
    }

    const elapsed = ((Date.now() - start.getTime()) / 1000).toFixed(1);
    console.log("\nSincronizacion completa en " + elapsed + "s");
  } catch (err) {
    console.error("\nError en sincronizacion: " + err.message);
    process.exit(1);
  }
}

main();
