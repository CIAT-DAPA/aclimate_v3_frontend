import type { Metadata } from "next";
import { COUNTRY_NAME } from "@/app/config";

const COUNTRY_LABEL = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");
const SITE_TITLE = `AClimate ${COUNTRY_LABEL}`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Escenarios climáticos";
  const description = `Escenarios climáticos mensuales para ${COUNTRY_LABEL}. Consulta características y recomendaciones por comunidad.`;
  const canonical = SITE_URL ? "/scenario" : undefined;

  return {
    title,
    description,
    keywords: [
      "escenarios",
      "pronóstico climático",
      "recomendaciones",
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

export default function ScenarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
