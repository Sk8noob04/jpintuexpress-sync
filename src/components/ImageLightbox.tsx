"use client";

import { useState, useEffect } from "react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
}

export default function ImageLightbox({ src, alt = "Referencia" }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-left group"
        aria-label="Ver imagen completa"
      >
        <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <img
            src={src}
            alt={alt}
            className="w-full max-h-72 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Overlay: always visible on mobile, hover-only on desktop */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          {/* Expand badge — always shown on mobile (touch), hover-only on desktop */}
          <div className="absolute bottom-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 bg-black/60 text-white rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Ampliar
          </div>
        </div>
        <p className="text-xs text-blue-500 mt-1.5 text-center">
          Toca la imagen para ampliar
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 bg-white/15 hover:bg-white/25 backdrop-blur-sm
                       text-white rounded-full w-11 h-11 flex items-center justify-center transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl px-4"
          />

          <p className="absolute bottom-5 left-0 right-0 text-center text-white/40 text-xs">
            Toca fuera de la imagen para cerrar · ESC
          </p>
        </div>
      )}
    </>
  );
}
