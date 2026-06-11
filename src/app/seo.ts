import type { Metadata } from "next";
import { COUNTRY_NAME } from "@/app/config";
import { getBranchConfig } from "@/app/configs";

const DEFAULT_OG_IMAGE = "/assets/img/bg.jpg";

const branchConfig = getBranchConfig();

const BRANCH_SITE_URLS: Record<string, string> = {
  honduras: "https://honduras.aclimate.org",
  nicaragua: "https://nicaragua.aclimate.org",
  salvador: "https://elsalvador.aclimate.org",
  amazonia: "https://amazonia.aclimate.org",
};

function normalizeSiteUrl(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/$/, "");
}

const ENV_SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
const BRANCH_SITE_URL = normalizeSiteUrl(BRANCH_SITE_URLS[branchConfig.name]);

const SITE_URL =
  ENV_SITE_URL || BRANCH_SITE_URL || "https://amazonia.aclimate.org";

export const COUNTRY_LABEL = COUNTRY_NAME.replace(/Amazonia/gi, "Amazonía");
export const SITE_NAME = branchConfig.displayName;
export const SITE_DESCRIPTION = buildDescription(
  branchConfig.aboutUs.description,
  `AClimate ${COUNTRY_LABEL} concentra información climática, agroclimática e hidrometeorológica para la toma de decisiones en la región.`,
);

const BASE_KEYWORDS = [
  "AClimate",
  SITE_NAME,
  COUNTRY_LABEL,
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
      locale: "es",
      url: getAbsoluteUrl("/"),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: getAbsoluteUrl("/"),
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

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    keywords: [...BASE_KEYWORDS, ...keywords],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type,
      siteName: SITE_NAME,
      locale: "es",
      url: canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical,
    },
  };
}
