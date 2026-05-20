"use client";

import { useState } from "react";
import { crearPrioridad, actualizarPrioridad, eliminarPrioridad } from "./actions";

interface Prioridad {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivel: number;
}

export default function PrioridadesClient({ prioridades }: { prioridades: Prioridad[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = prioridades.find((p) => p.id === editandoId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Lista */}
      <div className="lg:col-span-3">
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Descripcion</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nivel</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {prioridades.map((p) => (
                <tr key={p.id}
                  className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${editandoId === p.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.descripcion ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-500">{p.nivel}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditandoId(editandoId === p.id ? null : p.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {editandoId === p.id ? "Cancelar" : "Editar"}
                      </button>
                      <form
                        action={eliminarPrioridad}
                        className="inline"
                        onSubmit={(e) => {
                          if (!confirm(`¿Eliminar "${p.nombre}"?`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs text-red-500 hover:text-red-700 hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {prioridades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No hay prioridades configuradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="lg:col-span-2">
        {editando ? (
          /* Formulario editar */
          <div className="bg-white dark:bg-gray-800/60 rounded-xl border border-blue-200 dark:border-blue-800/40 p-6">
            <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-4">Editar prioridad</h2>
            <form action={actualizarPrioridad} className="space-y-4">
              <input type="hidden" name="id" value={editando.id} />
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  key={editando.id + "-nombre"}
                  name="nombre"
                  required
                  defaultValue={editando.nombre}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
                <input
                  key={editando.id + "-desc"}
                  name="descripcion"
                  defaultValue={editando.descripcion ?? ""}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel (1 = mas alto) <span className="text-red-500">*</span>
                </label>
                <input
                  key={editando.id + "-nivel"}
                  name="nivel"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={editando.nivel}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoId(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium
                             rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white
                             font-semibold rounded-lg text-sm transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Formulario nueva prioridad */
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Nueva prioridad</h2>
            <form action={crearPrioridad} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  name="nombre"
                  required
                  placeholder="Ej. Critica"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripcion</label>
                <input
                  name="descripcion"
                  placeholder="Descripcion breve"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel (1 = mas alto) <span className="text-red-500">*</span>
                </label>
                <input
                  name="nivel"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white
                           font-semibold rounded-lg text-sm transition"
              >
                Crear prioridad
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
