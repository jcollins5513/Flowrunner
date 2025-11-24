/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
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
}

module.exports = nextConfig

