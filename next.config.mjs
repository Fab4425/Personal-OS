/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@fullcalendar/react",
    "@fullcalendar/core",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/interaction",
  ],
  experimental: {
    serverComponentsExternalPackages: ["garmin-connect"],
  },
};

export default nextConfig;
