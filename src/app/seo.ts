import type { Metadata } from "next";
import { COUNTRY_NAME } from "@/app/config";
import { getBranchConfig } from "@/app/configs";

const DEFAULT_OG_IMAGE = "/assets/img/bg.jpg";
const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
const branchConfig = getBranchConfig();

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

function normalizeSiteUrl(value?: string) {
  if (!value) return "";
  return value.trim().replace(/\/$/, "");
}

function buildDescription(value: string, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  return firstSentence.length <= 180
    ? firstSentence
    : `${normalized.slice(0, 177).trimEnd()}...`;
}

export function getMetadataBase() {
  return SITE_URL ? new URL(SITE_URL) : undefined;
}

export function getAbsoluteUrl(pathname: string) {
  if (!SITE_URL) return pathname;

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
