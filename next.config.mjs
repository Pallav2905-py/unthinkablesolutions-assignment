/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests for dev
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
