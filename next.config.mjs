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
};

export default nextConfig;
