/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,  
  eslint: {
    ignoreDuringBuilds: true, // ข้ามการตรวจสอบ ESLint ระหว่าง build
  },
};

module.exports = nextConfig;
