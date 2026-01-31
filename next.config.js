/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  images: {
    domains: ['coopbkend-acfb9cb075e5.herokuapp.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? '/api' // Use proxy in production
      : 'https://coopbkend-acfb9cb075e5.herokuapp.com/api', // Direct connection in development
    NEXT_PUBLIC_BACKEND_URL: 'https://coopbkend-acfb9cb075e5.herokuapp.com',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;