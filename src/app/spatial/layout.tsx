import type { Metadata } from "next";
import { getBranchConfig } from "@/app/configs";
import { buildPageMetadata, COUNTRY_LABEL, SITE_NAME } from "@/app/seo";

export const dynamic = "force-dynamic";

const joinList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
};

export async function generateMetadata(): Promise<Metadata> {
  const config = getBranchConfig();
  const sections: string[] = [];

  if (config.spatial?.showClimateData) sections.push("datos climáticos");
  if (config.spatial?.showClimateIndicator)
    sections.push("indicadores climáticos");
  if (config.spatial?.showAgroclimaticIndicator)
    sections.push("indicadores agroclimáticos");
  if (config.spatial?.showHydrologicalIndicator)
    sections.push("indicadores hidrológicos");
  if (config.spatial?.showForecastPctChange || config.showScenario)
    sections.push("escenarios");

  const sectionsText = sections.length
    ? `Incluye ${joinList(sections)}.`
    : "Mapas e indicadores climáticos.";

  const title = "Información espacial";
  const description = `Información espacial de ${COUNTRY_LABEL}. ${sectionsText} Explora mapas, leyendas y series temporales.`;
  return buildPageMetadata({
    title,
    description,
    pathname: "/spatial",
    keywords: [
      "mapas",
      "indicadores",
      "clima",
      "agroclimático",
      COUNTRY_LABEL,
      SITE_NAME,
    ],
  });
}
