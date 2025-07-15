
import React from "react";
import Sidebar from "@/components/SideBar";
import Navbar from "@/components/Navbar";
export default function Home() {
  return (
    <div className="min-h-screen flex">
      <Navbar/>
      
      <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 ml-0  mt-16  text-black border-1 rounded-md border-[#3333]">
            <h1 className="text-2xl font-bold  ">รายการอุปกรณ์</h1>
            <hr />
            <p>นี้คือหน้าหลักนะจ๊ะ</p>
          </main>

      </div>
    </div>
  );
}
