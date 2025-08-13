"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [showRightSection, setShowRightSection] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [loginButtonVisible, setLoginButtonVisible] = useState(false);

  useEffect(() => {
    if (showRightSection) {
      // กำลังเปิดกล่อง
      setShowLoginButton(false); // ซ่อนปุ่มก่อน
      setLoginButtonVisible(false);
      setVisible(true); // แสดงกล่อง
      setTimeout(() => setIsOpening(true), 10);
    } else {
      // กำลังปิดกล่อง
      setIsOpening(false);
      // หลัง animation กล่องจบ (500ms)
      const timer1 = setTimeout(() => {
        setVisible(false);
        setShowLoginButton(true); // แสดงปุ่ม
        setLoginButtonVisible(false); // เริ่มด้วยซ่อนก่อน
        setTimeout(() => setLoginButtonVisible(true), 50); // ค่อยโชว์แบบนุ่มนวล
      }, 500);

      return () => clearTimeout(timer1);
    }
  }, [showRightSection]);

  // เมื่อกดปุ่มเข้าสู่ระบบ ให้ซ่อนปุ่มก่อน และแสดงกล่อง
  const handleLoginButtonClick = () => {
    setLoginButtonVisible(false); // เริ่ม animation ปุ่มซ่อน
    // รอ animation ปุ่มจบ (300ms) แล้วแสดงกล่อง
    setTimeout(() => {
      setShowLoginButton(false);
      setShowRightSection(true);
    }, 300);
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: 'url("/bg.jpg")' }}
    >
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0) 10%, rgba(0,0,0,0.5) 80%)",
        }}
      ></div>

      {/* Overlay เบลอ */}
      <div className="absolute inset-0 bg-white/1 backdrop-blur-[2px] z-0"></div>

      {/* Container */}
      {visible && (
        <div
          className={`relative bg-white shadow-lg rounded-md overflow-hidden z-10 flex flex-col md:flex-row transition-all duration-500 ease-in-out
            w-full max-w-[680px]
            ${
              showRightSection
                ? isOpening
                  ? "max-h-[440px] opacity-100 origin-bottom scale-y-100"
                  : "max-h-0 opacity-0 origin-top scale-y-0"
                : "max-h-0 opacity-0 origin-top scale-y-100"
            }
          `}
          style={{ transformOrigin: showRightSection ? "bottom" : "top" }}
        >
          {/* Left Section */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 md:p-6 bg-[#f4f4f4]">
            <img
              src="/Logo_of_University_of_Phayao.png"
              className="w-16 sm:w-20 mb-3 sm:mb-4"
              alt="UP Logo"
            />
            <h2 className="text-center text-sm sm:text-base text-gray-800 mb-2 leading-snug">
              <strong>General Education +</strong>
              <br />
              University of Phayao
            </h2>
            <button className="bg-[#5f41a3] text-white px-4 py-2 rounded text-sm sm:text-base mt-2 transition duration-200 ease-in-out hover:bg-[#4b3289] hover:scale-105">
              เข้าสู่ระบบด้วย UP Account
            </button>
            <p className="text-xs sm:text-sm text-gray-500 mt-4 text-center">
              Copyright © 2022 Division of Educational Services
            </p>
          </div>

          {/* Right Section */}
          <div className="relative w-full md:w-1/2 flex justify-center items-center h-48 sm:h-56 md:h-auto hidden md:flex">
            <img
              src="/right.jpg"
              className="w-full h-full object-cover rounded-r-md md:rounded-none"
              alt="UP"
            />
          </div>
          {/* x */}
          <button
            onClick={() => setShowRightSection(false)}
            className="absolute top-2 right-2 text-white bg-gray-400 bg-opacity-50 rounded-full w-7 h-7 flex items-center justify-center transition duration-200 ease-in-out hover:bg-opacity-80 hover:scale-110 z-20"
            aria-label="ปิด"
          >
            ✖
          </button>
        </div>
      )}

      {/* ปุ่ม เข้าสู่ระบบ พร้อม animation */}
      {showLoginButton && (
        <div
          className={`absolute bottom-4 left-0 right-0 flex justify-center px-4 sm:px-0 z-10
            transition-opacity duration-300 ease-in-out
            ${loginButtonVisible ? "opacity-100" : "opacity-0"}
          `}
        >
          <button
            onClick={handleLoginButtonClick}
            className="bg-[#5f41a3] text-white px-6 py-3 rounded text-base shadow-lg hover:bg-[#4b3289] hover:scale-105 transition duration-200 ease-in-out max-w-full sm:max-w-xs"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      )}
    </div>
  );
}
