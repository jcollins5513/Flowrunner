// Default public URLs so client-side code does not fall back to localhost in production
const vercelSiteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || vercelSiteUrl
const publicAssetBaseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL || publicSiteUrl

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: publicSiteUrl,
    NEXT_PUBLIC_ASSET_BASE_URL: publicAssetBaseUrl,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      ...(process.env.VERCEL_URL
        ? [
            {
              protocol: 'https',
              hostname: process.env.VERCEL_URL,
            },
          ]
        : []),
    ],
  },
  // Webpack configuration (kept for backward compatibility if needed)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        path: false,
        os: false,
      }

      config.resolve.alias = {
        ...config.resolve.alias,
        sharp: false,
        'node-vibrant': false,
        '@jimp/core': false,
        '@jimp/custom': false,
        '@jimp/types': false,
        '@jimp/gif': false,
        '@vibrant/image-node': false,
        gifwrap: false,
        'detect-libc': false,
        strtok3: false,
      }
    }
    return config
  },
  // Turbopack configuration for client-side module resolution
  turbopack: {
    resolveAlias: {
      // Node.js built-in modules (client-side fallbacks)
      fs: false,
      child_process: false,
      net: false,
      tls: false,
      path: false,
      os: false,
      // Image processing libraries (client-side disabled)
      sharp: false,
      'node-vibrant': false,
      '@jimp/core': false,
      '@jimp/custom': false,
      '@jimp/types': false,
      '@jimp/gif': false,
      '@vibrant/image-node': false,
      gifwrap: false,
      'detect-libc': false,
      strtok3: false,
    },
  },
}

module.exports = nextConfig
