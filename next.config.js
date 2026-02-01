/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  images: {
    domains: ['coopbkend-acfb9cb075e5.herokuapp.com', 'localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? '/api' // Use proxy in production
      : 'http://localhost:5000/api', // Local backend
    NEXT_PUBLIC_BACKEND_URL: process.env.NODE_ENV === 'production'
      ? 'https://coopbkend-acfb9cb075e5.herokuapp.com'
      : 'http://localhost:5000',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://coopbkend-acfb9cb075e5.herokuapp.com/api/:path*'
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;