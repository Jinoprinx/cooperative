/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['*'],
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://cooperative-kappa.vercel.app',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;