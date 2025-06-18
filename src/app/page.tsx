import Image from "next/image";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WeatherCard from "./components/WeatherCard";
import FeatureCard from "./components/FeatureCard";
import { Map, BarChart3, SlidersHorizontal } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gray-50">
      <Header />

      {/* Sección del Héroe - Pantalla completa */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          {/* Puedes reemplazar esta URL con tu imagen local */}
          <Image
            src="/assets/img/bg.jpg"
            alt="Paisaje climático de Colombia"
            fill
            className="object-cover"
            priority
          />
          {/* Degradado overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>

        {/* Contenido del héroe */}
        <div className="relative z-10 container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Bienvenido a <span className="text-green-400">AClimate</span>{" "}
                Colombia
              </h1>
              <p className="text-xl text-gray-200 leading-relaxed">
                Explora, monitorea y compara los datos de las estaciones
                climatológicas con bases de datos satelitales. Infórmate sobre
                cómo ha sido el clima en las regiones.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-green-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-green-700 transition-colors text-lg">
                  Explora el clima
                </button>
                <button className="border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-gray-800 transition-colors text-lg">
                  Ver estaciones
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <WeatherCard />
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-white"
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

      <main className="container mx-auto px-6 py-24">
        {/* Sección de Características */}
        <section className="bg-white py-16 rounded-lg shadow-lg">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Características principales
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre todas las herramientas que AClimate pone a tu
                disposición para el análisis climático en Colombia
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Map}
                title="Mapa interactivo"
                description="Consulta en un mapa interactivo la ubicación y datos históricos climáticos de las estaciones climatológicas, incluyendo temperaturas, precipitaciones y más."
              />
              <FeatureCard
                icon={BarChart3}
                title="Análisis de datos"
                description="Visualiza y analiza tendencias climáticas con gráficos interactivos y herramientas de comparación entre diferentes estaciones y períodos."
              />
              <FeatureCard
                icon={SlidersHorizontal}
                title="Configuración avanzada"
                description="Personaliza tu experiencia con filtros avanzados, alertas climáticas y configuraciones específicas para tu región de interés."
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
