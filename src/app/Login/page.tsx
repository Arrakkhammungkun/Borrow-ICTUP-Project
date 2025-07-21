"use client";

import React, { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const inputTextColor = (value: string) =>
    value ? "text-[#2b3e3e]" : "text-gray-400";

  return (
    <div className="min-h-screen bg-[#f3f5fb] flex items-center justify-center">
      <div className="flex w-[680px] h-[440px] bg-white shadow-lg rounded-md overflow-hidden border border-gray-200">
        {/* Left Section */}
        <div className="w-1/2 p-6 flex flex-col justify-between border-r">
          <div>
            <h2 className="text-blue-600 font-semibold text-sm">Login</h2>
            <h1 className="text-xl font-bold text-gray-800 mb-6">เข้าสู่ระบบ</h1>
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="text-sm text-gray-600">Username</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อผู้ใช้"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full mt-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 placeholder-gray-400 transition-all duration-200 ${inputTextColor(username)}`}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-gray-600">Password</label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full mt-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 placeholder-gray-400 transition-all duration-200 ${inputTextColor(password)}`}
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center text-sm text-gray-600">
                <input type="checkbox" className="mr-2" />
                จดจำฉัน
                <a href="#" className="ml-auto text-blue-500 hover:underline">
                  ลืมรหัสผ่าน
                </a>
              </div>

              {/* ปุ่ม Office 365 + Logo */}
              <div className="flex justify-center">
                <button className="flex items-center justify-center bg-[#a782e8] text-white font-medium px-4 py-2 rounded space-x-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_of_University_of_Phayao.svg/576px-Logo_of_University_of_Phayao.svg.png"
                    alt="UP Logo"
                    className="w-5 h-5"
                  />
                  <span>UP Office 365</span>
                </button>
              </div>
            </div>
          </div>

          {/* ปุ่มเข้าสู่ระบบ */}
          <div className="flex justify-center">
            <button className="w-48 bg-[#cce3e3] text-[#2b3e3e] font-semibold py-2 rounded mt-4">
              เข้าสู่ระบบ
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-1/2 flex flex-col justify-center items-center p-6 bg-[#e7f2f3]">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_of_University_of_Phayao.svg/576px-Logo_of_University_of_Phayao.svg.png"
            className="w-20 mb-4"
          />
          <h2 className="text-center text-sm text-gray-800 mb-2">
            <strong>General Education +</strong>
            <br />
            University of Phayao
          </h2>
          <button className="bg-[#5f41a3] text-white px-4 py-2 rounded text-sm mt-2">
            เข้าสู่ระบบด้วย UP Account
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Copyright © 2022 Division of Educational Services
          </p>
        </div>
      </div>
    </div>
  );
}
