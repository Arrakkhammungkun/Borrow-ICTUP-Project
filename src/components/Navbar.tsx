// src/components/Navbar.tsx
"use client"
import React from "react";


export default function Navbar() {
    const user ={name:"Admin"}; //รอเปลี่ยนจร้า


  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#5F9EA0] text-white h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* offset โลโก้ให้ไม่ทับ Sidebar บนเดสก์ท็อป */}
        <div className="ml-0 md:ml-64">

        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm">Logged in as: {user.name}</span>

      </div>
    </header>
  );
}
