/** @type {import('next').NextConfig} */
const nextConfig = {
  // v3 — aumenta limite de server actions para fotos de iPhone
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yiahavtmeappginyyyjp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
