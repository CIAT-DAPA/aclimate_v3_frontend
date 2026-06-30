import type { Metadata } from "next";
import { getBranchConfig } from "@/app/configs";

const DEFAULT_OG_IMAGE = "/assets/img/bg.jpg";

const branchConfig = getBranchConfig();

type AclimateAppSeoConfig = {
  countryName: string;
  countryLabel: string;
  siteUrl: string;
  siteName: string;
  locale: string;
};

const ACLIMATE_APP_SEO_CONFIGS: Record<string, AclimateAppSeoConfig> = {
  // TODO: confirmar IDs reales
  "1": {
    countryName: "Honduras",
    countryLabel: "Honduras",
    siteUrl: "https://honduras.aclimate.org",
    siteName: "AClimate Honduras",
    locale: "es_HN",
  },

  "2": {
    countryName: "Amazonia",
    countryLabel: "Amazonía",
    siteUrl: "https://amazonia.aclimate.org",
    siteName: "AClimate Amazonía",
    locale: "es",
  },

  "3": {
    countryName: "Nicaragua",
    countryLabel: "Nicaragua",
    siteUrl: "https://nicaragua.aclimate.org",
    siteName: "AClimate Nicaragua",
    locale: "es_NI",
  },

  "4": {
    countryName: "Salvador",
    countryLabel: "El Salvador",
    siteUrl: "https://elsalvador.aclimate.org",
    siteName: "AClimate El Salvador",
    locale: "es_SV",
  },
};

function normalizeSiteUrl(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/$/, "");
}

const ACLIMATE_APP_ID = process.env.NEXT_PUBLIC_ACLIMATE_APP_ID?.trim();

if (!ACLIMATE_APP_ID) {
  throw new Error(
    "Missing NEXT_PUBLIC_ACLIMATE_APP_ID. Define it in the environment file.",
  );
}

const appSeoConfig = ACLIMATE_APP_SEO_CONFIGS[ACLIMATE_APP_ID];

if (!appSeoConfig) {
  throw new Error(
    `Unknown NEXT_PUBLIC_ACLIMATE_APP_ID "${ACLIMATE_APP_ID}". Add it to ACLIMATE_APP_SEO_CONFIGS.`,
  );
}

const SITE_URL = normalizeSiteUrl(appSeoConfig.siteUrl);

export const COUNTRY_NAME = appSeoConfig.countryName;
export const COUNTRY_LABEL = appSeoConfig.countryLabel;
export const SITE_NAME = appSeoConfig.siteName;
export const SITE_LOCALE = appSeoConfig.locale;

export const SITE_DESCRIPTION = buildDescription(
  branchConfig.aboutUs.description,
  `${SITE_NAME} concentra información climática, agroclimática e hidrometeorológica para la toma de decisiones en ${COUNTRY_LABEL}.`,
);

const BASE_KEYWORDS = [
  "AClimate",
  SITE_NAME,
  COUNTRY_LABEL,
  `AClimate ${COUNTRY_LABEL}`,
  "clima",
  "agroclimático",
  "datos climáticos",
];

function buildDescription(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;

  return firstSentence.length <= 180
    ? firstSentence
    : `${normalized.slice(0, 177).trimEnd()}...`;
}

export function getMetadataBase() {
  return new URL(SITE_URL);
}

export function getAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, `${SITE_URL}/`).toString();
}

export function buildRootMetadata(): Metadata {
  const title = SITE_NAME;

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: title,
    keywords: [...BASE_KEYWORDS, branchConfig.aboutUs.projectTitle],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description: SITE_DESCRIPTION,
      type: "website",
      siteName: title,
      locale: SITE_LOCALE,
      url: getAbsoluteUrl("/"),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function buildPageMetadata({
  title,
  description,
  pathname,
  type = "website",
  keywords = [],
}: {
  title: string;
  description: string;
  pathname: string;
  type?: "website" | "article";
  keywords?: string[];
}): Metadata {
  const canonical = getAbsoluteUrl(pathname);

  const fullTitle = title.includes("AClimate")
    ? title
    : `${title} | ${SITE_NAME}`;

  return {
    metadataBase: getMetadataBase(),
    title: fullTitle,
    description,
    keywords: [...BASE_KEYWORDS, ...keywords],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: fullTitle,
      description,
      type,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical,
    },
  };
}
