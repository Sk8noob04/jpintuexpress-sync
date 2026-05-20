import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Pagina no encontrada</h1>
        <p className="text-sm text-gray-500 mb-6">La ruta que buscas no existe.</p>
        <Link href="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-lg transition">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
