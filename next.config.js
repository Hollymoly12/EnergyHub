/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "app.energyhub.be"] },
  },
};

module.exports = nextConfig;
