/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
