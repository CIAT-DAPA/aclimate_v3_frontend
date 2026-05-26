import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "./seo";

const PUBLIC_ROUTES = ["/", "/about", "/locations", "/spatial", "/scenario"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((pathname) => ({
    url: getAbsoluteUrl(pathname),
    lastModified: new Date(),
  }));
}
