import type { Metadata } from "next";
import { buildPageMetadata, COUNTRY_LABEL, SITE_NAME } from "@/app/seo";

export function generateMetadata(): Metadata {
  const title = "Escenarios climáticos";
  const description = `Escenarios climáticos mensuales para ${COUNTRY_LABEL}. Consulta características y recomendaciones por comunidad.`;

  return buildPageMetadata({
    title,
    description,
    pathname: "/scenario",
    keywords: [
      "escenarios",
      "pronóstico climático",
      "recomendaciones",
      COUNTRY_LABEL,
      SITE_NAME,
    ],
  });
}

export default function ScenarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
