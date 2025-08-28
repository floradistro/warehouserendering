/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config, { isServer }) => {
    // Handle GLSL shaders
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: 'raw-loader',
    });

    // Handle web workers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig
