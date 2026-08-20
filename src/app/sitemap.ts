import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "./seo";
import { getStationsForSitemap } from "@/app/lib/stations.server";

export const revalidate = 86400;

const PUBLIC_ROUTES = [
  {
    pathname: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    pathname: "/about",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    pathname: "/locations",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    pathname: "/spatial",
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    pathname: "/scenario",
    changeFrequency: "weekly",
    priority: 0.8,
  },
] satisfies Array<{
  pathname: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: getAbsoluteUrl(route.pathname),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const stations = await getStationsForSitemap();

  const stationRoutes: MetadataRoute.Sitemap = stations.map((station) => {
    const lastModified = station.latest_data?.date
      ? new Date(station.latest_data.date)
      : undefined;

    return {
      url: getAbsoluteUrl(`/m/${encodeURIComponent(station.machine_name!)}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  return [...staticRoutes, ...stationRoutes];
}
