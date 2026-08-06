/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === "production";

const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  serverExternalPackages: ["xlsx", "docxtemplater", "pizzip"],
  // Ensure quotation Word template is bundled for serverless runtimes
  outputFileTracingIncludes: {
    "/api/pipelines/[id]/quotation": ["./templates/quotation/**/*"],
  },
  async redirects() {
    return [
      { source: "/dashboard/projects", destination: "/dashboard/pipeline", permanent: true },
      { source: "/dashboard/projects/new", destination: "/dashboard/pipeline/new", permanent: true },
      {
        source: "/dashboard/projects/:id",
        destination: "/dashboard/pipeline/:id",
        permanent: true,
      },
      { source: "/api/export/projects", destination: "/api/export/pipelines", permanent: false },
      { source: "/dashboard/bd", destination: "/dashboard/prospects", permanent: true },
      { source: "/dashboard/bd-updates", destination: "/dashboard/prospects", permanent: true },
      {
        source: "/dashboard/admin/bd-monitoring",
        destination: "/dashboard/prospects",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      ...(isProduction
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
        : []),
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
