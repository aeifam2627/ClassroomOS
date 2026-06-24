import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ค่า default ของ Server Action (1MB) เล็กเกินไปสำหรับฟีเจอร์ส่งงานที่นักเรียนอัปโหลดไฟล์จริง
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
