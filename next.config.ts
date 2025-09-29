
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";
import {_ENTRIES} from '@ducanh2912/next-pwa/dist/build-fallback-worker-entry';

const {
  GEMINI_API_KEY,
  NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
} = process.env;

const pwaEntries = _ENTRIES;
const swDest = 'public/sw.js';
const firebaseMessagingSw = pwaEntries[swDest];
if (firebaseMessagingSw) {
  // @ts-expect-error: `fallback` is a private property.
  firebaseMessagingSw.fallback = firebaseMessagingSw.fallback
    ?.replace('__FIREBASE_API_KEY__', NEXT_PUBLIC_FIREBASE_API_KEY)
    .replace('__FIREBASE_AUTH_DOMAIN__', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
    .replace('__FIREBASE_PROJECT_ID__', NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    .replace('__FIREBASE_STORAGE_BUCKET__', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
    .replace(
      '__FIREBASE_MESSAGING_SENDER_ID__',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    )
    .replace('__FIREBASE_APP_ID__', NEXT_PUBLIC_FIREBASE_APP_ID)
    .replace(
      '__FIREBASE_MEASUREMENT_ID__',
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    );
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/~offline",
  },
  sw: 'sw.js',
  importScripts: ["/firebase-messaging-sw.js"]
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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
