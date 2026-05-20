"use client";

import { useActionState, useRef, useState } from "react";
import { crearSolicitud } from "./actions";

/** Comprime imagen vía Canvas a ≤ maxMB. Funciona en iOS Safari y Android Chrome. */
async function compressImage(file: File, maxMB = 1.5): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else                  { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const tryBlob = (q: number) =>
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size > maxMB * 1024 * 1024 && q > 0.35) { tryBlob(q - 0.15); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", q);
      tryBlob(0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

interface Prioridad { id: string; nombre: string; nivel: number; }

interface Props {
  prioridades: Prioridad[];
  hoy: string;
  error?: string;
  defaultMotivo?: string;
  defaultPlaca?: string;
  defaultProveedor?: string;
  defaultCosto?: string;
  defaultPrioridadId?: string;
  defaultFechaLimite?: string;
}

function RequiredMark({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-red-500 ml-0.5">*</span>;
}

export default function NuevaForm({ prioridades, hoy, error: initError, defaultMotivo, defaultPlaca, defaultProveedor, defaultCosto, defaultPrioridadId, defaultFechaLimite }: Props) {
  const [state, action, pending] = useActionState(crearSolicitud, { error: initError ?? null });

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // Track filled state for each required field to show/hide asterisk
  const [filled, setFilled] = useState({
    motivo:       !!defaultMotivo,
    placa:        !!defaultPlaca,
    costo:        !!defaultCosto,
    prioridad_id: !!defaultPrioridadId,
    fecha_limite: !!defaultFechaLimite,
    proveedor:    !!defaultProveedor,
  });

  function markFilled(field: keyof typeof filled, value: string) {
    setFilled(prev => ({ ...prev, [field]: value.trim().length > 0 }));
  }

  async function processFile(file: File) {
    setCompressing(true);
    try {
      const processed = file.size > 500 * 1024 ? await compressImage(file) : file;
      const dt = new DataTransfer();
      dt.items.add(processed);
      if (galleryRef.current) galleryRef.current.files = dt.files;
      setFileName(processed.name);
      setPreview(URL.createObjectURL(processed));
    } finally {
      setCompressing(false);
    }
  }

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      {state?.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Descripción de la compra<RequiredMark show={!filled.motivo} />
        </label>
        <textarea
          name="motivo"
          required
          minLength={3}
          rows={3}
          defaultValue={defaultMotivo}
          placeholder="Describe detalladamente el motivo de esta solicitud..."
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none transition"
          onChange={e => markFilled("motivo", e.target.value)}
        />
      </div>

      {/* Placa + Costo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Placa / Vehiculo<RequiredMark show={!filled.placa} />
          </label>
          <input
            name="placa"
            type="text"
            required
            defaultValue={defaultPlaca}
            placeholder="Ej: A-123456"
            maxLength={20}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 dark:placeholder:text-gray-500 transition uppercase"
            onChange={e => {
              e.target.value = e.target.value.toUpperCase();
              markFilled("placa", e.target.value);
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Monto (USD)<RequiredMark show={!filled.costo} />
          </label>
          <input
            name="costo_estimado"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultCosto}
            placeholder="0.00"
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
            onChange={e => markFilled("costo", e.target.value)}
          />
        </div>
      </div>

      {/* Prioridad + Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Prioridad<RequiredMark show={!filled.prioridad_id} />
          </label>
          <select
            name="prioridad_id"
            required
            defaultValue={defaultPrioridadId ?? ""}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            onChange={e => markFilled("prioridad_id", e.target.value)}
          >
            <option value="">Selecciona prioridad</option>
            {prioridades.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Fecha limite<RequiredMark show={!filled.fecha_limite} />
          </label>
          <input
            name="fecha_limite"
            type="date"
            required
            min={hoy}
            defaultValue={defaultFechaLimite}
            className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            onChange={e => markFilled("fecha_limite", e.target.value)}
          />
        </div>
      </div>

      {/* Proveedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Proveedor<RequiredMark show={!filled.proveedor} />
        </label>
        <input
          name="proveedor"
          type="text"
          required
          defaultValue={defaultProveedor}
          placeholder="Nombre del proveedor o empresa"
          className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
          onChange={e => markFilled("proveedor", e.target.value)}
        />
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Imagen de referencia
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
        </label>

        <input
          ref={galleryRef}
          name="imagen"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
        <input
          ref={cameraRef}
          name="imagen_cam"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />

        <div className="flex gap-2 mb-3">
          <button
            type="button"
            disabled={compressing}
            onClick={() => galleryRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                       border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       text-gray-600 dark:text-gray-400
                       hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition
                       disabled:opacity-50 disabled:cursor-not-allowed">
            {compressing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {compressing ? "Procesando..." : "Galería"}
          </button>
          <button
            type="button"
            disabled={compressing}
            onClick={() => cameraRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                       border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm
                       text-gray-600 dark:text-gray-400
                       hover:border-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition
                       disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Tomar foto
          </button>
        </div>

        {preview && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Vista previa" className="w-full max-h-48 object-contain" />
            <div className="px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{fileName}</p>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFileName(null);
                  if (galleryRef.current) galleryRef.current.value = "";
                  if (cameraRef.current) cameraRef.current.value = "";
                }}
                className="text-xs text-red-500 hover:underline ml-2 shrink-0">
                Quitar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <a
          href="/solicitudes"
          className="flex-1 text-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                        rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          Cancelar
        </a>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70
                     disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm
                     transition inline-flex items-center justify-center gap-2">
          {pending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Enviando...
            </>
          ) : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
