"use client";
import Image from "next/image";
import WeatherCard from "./components/WeatherCard";
import Link from "next/link";
import { COUNTRY_NAME } from "./config";
import { useCountry } from "@/app/contexts/CountryContext";

export default function Home() {
  const { countryId } = useCountry();
  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/img/bg.jpg"
            alt="Paisaje climático"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-8 sm:gap-12 items-center">
            <div className="space-y-8 sm:space-y-12 md:col-span-3 2xl:col-span-2 col-span-4">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-amber-50 text-balance">
                  Bienvenido a AClimate {COUNTRY_NAME}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-amber-50 text-pretty">
                  Explora, monitorea y compara datos satelitales, informate sobre como ha sido el clima en las regiones.
                </p>
                <div className="flex flex-col md:flex-row gap-4 text-center">
                  <Link
                    href={`/spatial/${countryId || '1'}`}
                    className="bg-[#bc6c25] text-amber-50 font-semibold py-2 px-6 sm:px-8 rounded-full hover:bg-amber-700 transition-colors text-base sm:text-lg"
                  >
                    Explorar
                  </Link>
                </div>
              </div>
              <WeatherCard />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
