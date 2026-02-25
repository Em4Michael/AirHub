import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    'http://192.168.0.*:3000',
    'http://192.168.0.108:3000',
    'http://192.168.0.108',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
};

export default nextConfig;