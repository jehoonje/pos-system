// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://52.79.57.150:8383/:path*',
      },
    ];
  },
}

export default nextConfig;
