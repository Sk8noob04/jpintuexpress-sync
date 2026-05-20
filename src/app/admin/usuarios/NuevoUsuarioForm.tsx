"use client";

import { useState } from "react";
import { crearUsuario } from "./actions";

export default function NuevoUsuarioForm() {
  const [result, setResult] = useState<{ error?: string; tempPassword?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    const res = await crearUsuario(formData);
    setResult(res as any);
    setLoading(false);
    if ((res as any).ok) {
      const form = document.getElementById("nuevo-usuario-form") as HTMLFormElement;
      form?.reset();
    }
  }

  return (
    <div className="glass-card p-6 mb-1">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Crear nuevo usuario</h2>

      {result?.error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {result.error}
        </div>
      )}

      {result?.tempPassword && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <strong>Usuario creado.</strong> Contrasena temporal:{" "}
          <code className="font-mono bg-green-100 px-1 rounded">{result.tempPassword}</code>
          <br />
          <span className="text-xs text-green-600">Comparte esta contrasena con el usuario — debera cambiarla en su primer inicio de sesion.</span>
        </div>
      )}

      <form id="nuevo-usuario-form" action={handleSubmit} className="flex flex-wrap gap-3">
        <input
          name="nombre_completo"
          type="text"
          required
          placeholder="Nombre completo"
          className="flex-1 min-w-40 px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="email@empresa.com"
          className="flex-1 min-w-40 px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition"
        />
        <input
          name="telefono"
          type="tel"
          placeholder="WhatsApp (ej: 50761234567)"
          className="flex-1 min-w-40 px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 transition"
        />
        <select
          name="role"
          required
          className="px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">Rol</option>
          <option value="solicitante">Solicitante</option>
          <option value="aprobador">Aprobador</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                     text-white font-semibold rounded-lg text-sm transition"
        >
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </form>
    </div>
  );
}
