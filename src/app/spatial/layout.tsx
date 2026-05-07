import type { Metadata } from "next";
import { COUNTRY_NAME } from "@/app/config";
import { getBranchConfig } from "@/app/configs";

const COUNTRY_LABEL = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");
const SITE_TITLE = `AClimate ${COUNTRY_LABEL}`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

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
  const canonical = SITE_URL ? "/spatial" : undefined;

  return {
    title,
    description,
    keywords: [
      "mapas",
      "indicadores",
      "clima",
      "agroclimático",
      COUNTRY_LABEL,
      SITE_TITLE,
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_TITLE,
      locale: "es",
      images: ["/assets/img/bg.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/assets/img/bg.jpg"],
    },
    alternates: canonical ? { canonical } : undefined,
  };
}

export default function SpatialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
