import React, { useEffect } from "react";

export default function FullScreenLoader() {
  useEffect(() => {

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-[10001]"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent text-white"

        ></div>
        <span className="text-white">กำลังโหลด กรุณารอสักครู่...</span>
      </div>
    </div>
  );
}
