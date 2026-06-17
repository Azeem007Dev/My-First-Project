/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes (server-side features)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
