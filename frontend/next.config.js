/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    // Allow images served from the FastAPI backend
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/static/**',
      },
      // Allow Replicate CDN URLs (legacy designs already in DB)
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
      // Allow any other image CDN you might use in future
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Allow API calls to backend without CORS issues in dev
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig