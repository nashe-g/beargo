import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/admin/experiences/**": ["./content/beargo_365_inspiration_library.jsonl"],
    "/api/admin/experiences/**": ["./content/beargo_365_inspiration_library.jsonl"],
  },
};

export default nextConfig;
