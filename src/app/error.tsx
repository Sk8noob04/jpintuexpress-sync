"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Algo salio mal</h2>
        <p className="text-sm text-gray-500 mb-6">Ocurrio un error inesperado. Intenta de nuevo.</p>
        <button onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-lg transition">
          Reintentar
        </button>
      </div>
    </div>
  );
}
