/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
          allowedOrigins: [
            "reimagined-halibut-wrvqx9prwxvrcrj7-3000.app.github.dev",
            "localhost:3000",
          ],
          missingSuspenseWithCSRBailout: true,
        },
      },
};

export default nextConfig;
