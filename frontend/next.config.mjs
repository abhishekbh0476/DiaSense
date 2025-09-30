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
  
  // Experimental features
  experimental: {
    // Suppress hydration warnings
    suppressHydrationWarning: true,
  },
};

export default nextConfig;
