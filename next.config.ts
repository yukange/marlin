import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },

  // Cloudflare Pages compatibility
  output: "standalone",
  
  // Enable source maps for production debugging
  productionBrowserSourceMaps: true,

  // Optimize for edge runtime
  experimental: {
    // Enable Server Actions on edge
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Turbopack configuration for markdown files
    turbo: {
      rules: {
        '*.md': {
          loaders: ['raw-loader'],
          as: '*.js',
        },
      },
    },
  },
  
  // Image optimization for Cloudflare
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration for markdown files
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })
    return config
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ],
      },
    ]
  },
};

export default nextConfig;
