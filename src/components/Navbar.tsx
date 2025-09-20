"use client"

import React from "react";
import { useUser } from '@/contexts/UserContext';
import FullScreenLoader from "./FullScreenLoader";

export default function Navbar() {
  const { user, loading } = useUser();
  
  return (
    <>
      {/* Navbar แสดงตลอด */}
      <header className="fixed top-0 left-0 right-0 z-40  text-[#364153] h-16 flex items-center justify-between px-6 border border-[#E5E7EB]">
        <div className="flex items-center">
          <div className="ml-0 md:ml-64">
            {/* logo หรืออะไรเพิ่มเติม */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">
              {user ? ` ${user?.displayName}` : "Loading..."}
          </span>
        </div>
      </header>

      {/* Loader ทับหน้าทั้งหมด */}
      {loading && <FullScreenLoader />}
    </>
  );
}
