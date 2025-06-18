// src/app/locations/page.tsx
import Link from "next/link";

export default function LocationsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Página de Locations
      </h1>
      <Link
        href="/"
        className="mt-8 bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
