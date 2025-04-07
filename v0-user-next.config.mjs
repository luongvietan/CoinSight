// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseio.com; " +
              "connect-src 'self' *.googleapis.com *.firebaseio.com wss://*.firebaseio.com api.openai.com api.stripe.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: *.googleusercontent.com; " +
              "font-src 'self' data:; " +
              "frame-src 'self' *.firebaseapp.com *.stripe.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
