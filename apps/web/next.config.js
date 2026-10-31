/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Next 16 blocks 127.0.0.1/localhost. MinIO is loopback in local compose.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
