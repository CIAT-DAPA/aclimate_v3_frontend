import Image from "next/image";
import WeatherCard from "./components/WeatherCard";
import FeatureCard from "./components/FeatureCard";
import { Map, LayoutGrid, Newspaper } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/img/bg.jpg"
            alt="Paisaje climático de Colombia"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
        <div className="relative z-10 container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-12 items-center">
            <div className="space-y-12 md:col-span-3 2xl:col-span-2 col-span-4">
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-semibold text-amber-50 text-balance">
                  Bienvenido a AClimate Colombia
                </h1>
                <p className="text-xl text-amber-50 text-pretty">
                  Explora, monitorea y compara los datos de las estaciones
                  climátologicas con bases de datos satelitales. Informate sobre
                  como ha sido el clima en las regiones.
                </p>
                <div className="flex flex-col md:flex-row gap-4 text-center">
                  <Link
                    href="/locations"
                    className="bg-[#bc6c25] text-amber-50 font-semibold py-2 px-8 rounded-full hover:bg-amber-700 transition-colors text-lg"
                  >
                    Explora el clima
                  </Link>
                </div>
              </div>
              <WeatherCard />
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-18 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-amber-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>
      <main className="bg-white">
        <section>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              bg
              icon={Map}
              title="Mapa interactivo de estaciones climáticas"
              description="Consulta en un mapa interactivo la ubicación y datos históricos climáticos de las estaciones climatológicas, incluyendo temperaturas, precipitaciones y más."
            />
            <FeatureCard
              icon={LayoutGrid}
              title="Dashboard de análisis climático"
              description="Visualiza la temperatura máxima, mínima, precipitaciones y otros datos clave en un dashboard diseñado para el análisis climático en tiempo real."
            />
            <FeatureCard
              bg
              icon={Newspaper}
              title="Subscripción a boletines climáticos"
              description="Recibe actualizaciones periódicas sobre el clima en tu región, incluyendo alertas de condiciones extremas y resúmenes de datos."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
