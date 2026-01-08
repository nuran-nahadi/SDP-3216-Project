import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:8000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
