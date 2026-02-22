/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    'http://192.168.0.*:3000',      // wildcard for your subnet
    'http://192.168.0.108:3000',
    'http://192.168.0.108',
    'http://localhost:3000',        // explicit (though usually auto-allowed)
    'http://127.0.0.1:3000',
  ],
};

export default nextConfig;