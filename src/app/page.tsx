"use client";
import Image from "next/image";
import WeatherCard from "./components/WeatherCard";
import { COUNTRY_NAME } from "./config";
import { useI18n } from "@/app/contexts/I18nContext";
import { UIButtonLink } from "@/app/components/ui/button";

export default function Home() {
  const { t } = useI18n();
  const countryLabel = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");

  return (
    <div className="overflow-x-hidden">
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/img/bg.jpg"
            alt={t("home.hero.backgroundAlt")}
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
                  {t("home.hero.title", { country: countryLabel })}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-amber-50 text-pretty">
                  {t("home.hero.subtitle")}
                </p>
                <div className="flex flex-col md:flex-row gap-4 text-center">
                  <UIButtonLink href="/spatial" size="lg">
                    {t("home.hero.cta")}
                  </UIButtonLink>
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
