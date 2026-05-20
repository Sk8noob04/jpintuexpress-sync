"use client";

import { useState, useEffect } from "react";

interface Activo {
  id: string;
  nombre: string;
}

export default function ActivoSelector() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const lineaSelect = document.getElementById("linea_select") as HTMLSelectElement;
    if (!lineaSelect) return;

    const handleChange = async () => {
      const lineaId = lineaSelect.value;
      if (!lineaId) {
        setActivos([]);
        setError(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/activos?linea_id=${encodeURIComponent(lineaId)}`);
        if (!res.ok) throw new Error("Error al cargar");
        const data: Activo[] = await res.json();
        setActivos(data);
      } catch {
        setError(true);
        setActivos([]);
      } finally {
        setLoading(false);
      }
    };

    lineaSelect.addEventListener("change", handleChange);
    return () => lineaSelect.removeEventListener("change", handleChange);
  }, []);

  const placeholder = loading
    ? "Cargando placas..."
    : error
    ? "Error al cargar. Intenta de nuevo."
    : activos.length === 0
    ? "Selecciona una linea primero"
    : "Selecciona una placa";

  return (
    <select
      name="activo_id"
      required
      disabled={activos.length === 0}
      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 bg-white transition disabled:bg-gray-100 disabled:text-gray-400"
    >
      <option value="">{placeholder}</option>
      {activos.map((a) => (
        <option key={a.id} value={a.id}>{a.nombre}</option>
      ))}
    </select>
  );
}
