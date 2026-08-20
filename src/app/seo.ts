import type { Metadata } from "next";
import { getBranchConfig } from "@/app/configs";

const DEFAULT_OG_IMAGE = "/assets/img/bg.jpg";
const DEFAULT_COUNTRY_NAME = "Amazonia";

const branchConfig = getBranchConfig();

type AclimateAppSeoConfig = {
  countryName: string;
  countryLabel: string;
  siteUrl: string;
  siteName: string;
  locale: string;
  apiCountryId: string;
};

type CountryKey = "honduras" | "amazonia" | "nicaragua" | "el-salvador" | "guatemala";

const ACLIMATE_COUNTRY_CONFIGS: Record<CountryKey, AclimateAppSeoConfig> = {
  honduras: {
    countryName: "Honduras",
    countryLabel: "Honduras",
    siteUrl: "https://honduras.aclimate.org",
    siteName: "AClimate Honduras",
    locale: "es_HN",
    apiCountryId: "1",
  },

  amazonia: {
    countryName: "Amazonia",
    countryLabel: "Amazonía",
    siteUrl: "https://amazonia.aclimate.org",
    siteName: "AClimate Amazonía",
    locale: "es",
    apiCountryId: "2",
  },

  nicaragua: {
    countryName: "Nicaragua",
    countryLabel: "Nicaragua",
    siteUrl: "https://nicaragua.aclimate.org",
    siteName: "AClimate Nicaragua",
    locale: "es_NI",
    apiCountryId: "3",
  },

  "el-salvador": {
    countryName: "Salvador",
    countryLabel: "El Salvador",
    siteUrl: "https://elsalvador.aclimate.org",
    siteName: "AClimate El Salvador",
    locale: "es_SV",
    apiCountryId: "4",
  },

  guatemala: {
    countryName: "Guatemala",
    countryLabel: "Guatemala",
    siteUrl: "https://guatemala.aclimate.org",
    siteName: "AClimate Guatemala",
    locale: "es_GT",
    apiCountryId: "5",
  },
};

function normalizeCountryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

const COUNTRY_ALIASES: Record<string, CountryKey> = {
  honduras: "honduras",

  amazonia: "amazonia",

  nicaragua: "nicaragua",

  salvador: "el-salvador",
  "el salvador": "el-salvador",
  elsalvador: "el-salvador",

  guatemala: "guatemala",
};

export function getConfiguredCountryName() {
  return process.env.NEXT_PUBLIC_COUNTRY_NAME?.trim() || DEFAULT_COUNTRY_NAME;
}

export function getSeoConfig(): AclimateAppSeoConfig {
  const configuredCountryName = getConfiguredCountryName();
  const normalizedCountryName = normalizeCountryName(configuredCountryName);

  const countryKey = COUNTRY_ALIASES[normalizedCountryName];

  if (!countryKey) {
    console.warn(
      `[seo] País desconocido "${configuredCountryName}" en NEXT_PUBLIC_COUNTRY_NAME. ` +
        `Se utilizará "${DEFAULT_COUNTRY_NAME}" como configuración predeterminada.`,
    );

    return ACLIMATE_COUNTRY_CONFIGS.amazonia;
  }

  return ACLIMATE_COUNTRY_CONFIGS[countryKey];
}

export function getApiCountryId() {
  return getSeoConfig().apiCountryId;
}

const appSeoConfig = getSeoConfig();

const SITE_URL = appSeoConfig.siteUrl;

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

  if (!normalized) {
    return fallback;
  }

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
