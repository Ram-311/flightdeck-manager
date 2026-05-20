import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline"
  },
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/results.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "flight-search-results",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60
        }
      }
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }
      }
    },
    {
      urlPattern: /\/bookings/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "my-bookings",
        expiration: {
          maxEntries: 12,
          maxAgeSeconds: 60 * 60 * 24 * 7
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default withPWA(nextConfig);
