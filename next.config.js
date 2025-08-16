/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['coopbkend-acfb9cb075e5.herokuapp.com'],
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