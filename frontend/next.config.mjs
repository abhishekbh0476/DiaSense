/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress hydration warnings in development
  reactStrictMode: true,
  
  // Custom webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Suppress hydration warnings caused by browser extensions
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  
  // Turbopack config (empty - silences Turbopack/webpack conflict in Next 16+)
  turbopack: {},
  
  // Note: Do NOT use rewrites for /api/* routes as they conflict with Next.js API routes.
  // API routes in src/app/api/* handle the proxying themselves.
};

export default nextConfig;
