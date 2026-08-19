import { CANONICAL_ORIGIN } from "@/lib/config";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/host", "/merchant", "/lab", "/ops", "/api/", "/r/"],
    },
    host: CANONICAL_ORIGIN,
  };
}
