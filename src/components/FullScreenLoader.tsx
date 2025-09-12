import React, { useEffect } from "react";

export default function FullScreenLoader() {
  useEffect(() => {
    // ปิดการ scroll เมื่อ loader แสดง
    document.body.style.overflow = "hidden";

    // คืนค่าเดิมเมื่อ component ถูกถอดออก
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]"
      role="status"
      aria-label="Loading"
    >
      <div
        className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-e-transparent text-white"
      ></div>
    </div>
  );
}
