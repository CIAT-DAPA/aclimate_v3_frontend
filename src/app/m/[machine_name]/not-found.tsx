import Link from "next/link";

export default function StationNotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Estación no encontrada
        </h1>
        <p className="text-gray-600 mb-4">
          La estación climática solicitada no existe o no está disponible.
        </p>
        <Link
          href="/locations"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-brand-green text-white"
        >
          Ver estaciones disponibles
        </Link>
      </div>
    </div>
  );
}
