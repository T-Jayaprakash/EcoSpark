import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/weather/:path*",
        destination: "http://localhost:3003/api/weather/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3001/socket.io/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:3001/health",
      },
    ];
  },
};

export default nextConfig;
