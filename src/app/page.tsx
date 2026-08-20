import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import {
  buildPageMetadata,
  COUNTRY_LABEL,
  SITE_NAME,
  getAbsoluteUrl,
} from "./seo";

const HOME_TITLE = `${SITE_NAME} | Información climática y agroclimática`;
const HOME_DESCRIPTION = `AClimate ${COUNTRY_LABEL} es una plataforma de información climática, agroclimática e hidrometeorológica para consultar mapas, indicadores, estaciones y escenarios por región.`;

export const metadata: Metadata = buildPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  pathname: "/",
  keywords: [
    "AClimate",
    COUNTRY_LABEL,
    SITE_NAME,
    "información climática",
    "información agroclimática",
    "mapas climáticos",
    "estaciones meteorológicas",
  ],
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["Organization", "WebSite"],
  name: SITE_NAME,
  alternateName: `AClimate ${COUNTRY_LABEL}`,
  url: getAbsoluteUrl("/"),
  description: HOME_DESCRIPTION,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
