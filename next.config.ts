import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },

  // Cloudflare Pages compatibility
  output: "standalone",
  
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
  },

  // Webpack configuration for markdown files
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })
    return config
  },
};

export default nextConfig;
