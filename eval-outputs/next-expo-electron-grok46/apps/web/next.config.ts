import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@example/features',
    '@example/client-sdk',
    '@example/design-system',
    '@example/libraries',
    '@example/core',
    '@example/api',
  ],
  experimental: {
    optimizePackageImports: [
      '@example/features',
      '@example/client-sdk',
      '@example/design-system',
    ],
  },
}

export default nextConfig
