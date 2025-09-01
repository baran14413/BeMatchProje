
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Bu, Turbopack ile uyumluluk sorunlarını önlemek içindir.
    // Geliştirme ortamında bu ayarı atlıyoruz.
    if (process.env.NODE_ENV === 'development') {
      return config;
    }
    // Gerekli diğer webpack ayarları buraya eklenebilir.
    return config;
  },
};

export default withPWA(nextConfig);
