/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable instrumentation hook (runs DB schema sync at server startup)
  experimental: {
    instrumentationHook: true,
  },

  // Allow images from Whop CDN
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.whop.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;
