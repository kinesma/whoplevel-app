/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Whop CDN
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.whop.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
    ],
  },
};

module.exports = nextConfig;
