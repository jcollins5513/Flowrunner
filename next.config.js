/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'images.unsplash.com'],
    remotePatterns: [
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
    // Exclude Node.js-only modules from client bundle
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
      
      // Ignore Node.js-only modules and their dependencies in client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp': false,
        'node-vibrant': false,
        '@jimp/core': false,
        '@jimp/custom': false,
        '@jimp/types': false,
        '@jimp/gif': false,
        '@vibrant/image-node': false,
        'gifwrap': false,
        'detect-libc': false,
        'strtok3': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

