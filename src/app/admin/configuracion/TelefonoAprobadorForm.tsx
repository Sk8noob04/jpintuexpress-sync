"use client";

import { useState } from "react";

interface Aprobador {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
}

interface Props {
  aprobadores: Aprobador[];
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>;
}

export default function TelefonoAprobadorForm({ aprobadores, action }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(aprobadores.map((a) => [a.id, a.telefono ?? ""]))
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved]   = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave(id: string) {
    setSaving((s) => ({ ...s, [id]: true }));
    setSaved((s)  => ({ ...s, [id]: false }));
    setErrors((e) => ({ ...e, [id]: "" }));

    const fd = new FormData();
    fd.append("id", id);
    fd.append("telefono", values[id] ?? "");
    const res = await action(fd);

    setSaving((s) => ({ ...s, [id]: false }));
    if (res?.ok) {
      setSaved((s) => ({ ...s, [id]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2500);
    } else {
      setErrors((e) => ({ ...e, [id]: res?.error ?? "Error" }));
    }
  }

  if (aprobadores.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
        No hay usuarios con rol <strong>aprobador</strong> todavía. Crea uno primero en{" "}
        <a href="/admin/usuarios" className="underline font-medium">Admin → Usuarios</a>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {aprobadores.map((a) => (
        <div key={a.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{a.nombre_completo}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{a.email}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">WhatsApp:</span>
            <input
              type="tel"
              value={values[a.id] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [a.id]: e.target.value }))}
              placeholder="50761234567"
              className="w-36 text-sm glass-input px-3 py-1.5 rounded-lg"
            />
            <button
              onClick={() => handleSave(a.id)}
              disabled={saving[a.id]}
              className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                         text-white font-medium rounded-lg transition"
            >
              {saving[a.id] ? "..." : saved[a.id] ? "✓ Guardado" : "Guardar"}
            </button>
          </div>

          {errors[a.id] && (
            <p className="w-full text-xs text-red-600 dark:text-red-400 mt-1">{errors[a.id]}</p>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        💡 El número debe incluir el código de país sin el &quot;+&quot;. Ejemplo Panamá:{" "}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">50761234567</code>
      </p>
    </div>
  );
}
