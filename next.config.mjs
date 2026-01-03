/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'chromadb',
      'onnxruntime-node',
      '@huggingface/transformers',
      '@chroma-core/default-embed',
    ],
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'nodemailer': false,
      };
    }
    return config;
  },
};

export default nextConfig;
