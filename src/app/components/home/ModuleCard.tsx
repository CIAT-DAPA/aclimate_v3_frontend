"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMap,
  faCloudSun,
  faSatellite,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ModuleInfo } from "@/app/types/home";
import { useI18n } from "@/app/contexts/I18nContext";

interface ModuleCardProps {
  module: ModuleInfo;
  index: number;
}

const MODULE_ICONS: Record<string, IconDefinition> = {
  stations: faLocationDot,
  spatial: faMap,
  scenario: faCloudSun,
  communityMonitoring: faSatellite,
};

export default function ModuleCard({ module, index }: ModuleCardProps) {
  const { t } = useI18n();
  const icon = MODULE_ICONS[module.key] || faMap;

  // Interleaving colors: odd = primary, even = tertiary
  const isOdd = index % 2 === 0;
  const bgColor = `rgba(${isOdd ? "var(--color-primary-rgb)" : "var(--color-tertiary-rgb)"}, 0.12)`;
  const textColor = isOdd ? "var(--color-primary)" : "var(--color-tertiary)";

  const content = (
    <div
      className="flex flex-col items-center text-center gap-3 p-6 sm:p-8 transition-all duration-200 hover:shadow-lg hover:brightness-110 hover:ring-1 hover:ring-inset focus-visible:ring-2 cursor-pointer h-full justify-between"
      style={{ backgroundColor: bgColor }}
    >
      {/* Icono + Texto */}
      <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center">
        {/* Icono con fondo circular */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full shrink-0"
          style={{ backgroundColor: `${isOdd ? "var(--color-primary)" : "var(--color-tertiary)"}` }}
        >
          <FontAwesomeIcon icon={icon} className="h-6 w-6 text-white" />
        </div>

        {/* Texto */}
        <div>
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: textColor }}
          >
            {t(`home.modules.${module.key}.title`)}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-dark)", opacity: 0.7 }}>
            {t(`home.modules.${module.key}.description`)}
          </p>
        </div>
      </div>

      {/* Botón Ver */}
      <span
        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:brightness-110"
        style={{
          backgroundColor: textColor,
          color: "var(--color-text-light)",
        }}
      >
        {t("home.modules.viewButton")}
      </span>
    </div>
  );

  // External link for community monitoring
  if (module.key === "communityMonitoring") {
    return (
      <a
        href={module.route}
        target="_blank"
        rel="noopener noreferrer"
        className="block flex-1 min-w-0 h-full"
      >
        {content}
      </a>
    );
  }

  return <Link href={module.route} className="block flex-1 min-w-0 h-full">{content}</Link>;
}