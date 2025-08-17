"use client";

import { useEffect, useState } from "react";
import { RedirectRequest } from "@azure/msal-browser";
import { useRouter } from "next/navigation";
import { msalInstance } from "@/lib/msal";
import ".././globals.css";
import { useUser } from "@/contexts/UserContext";
export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const {setUser} =useUser();
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (data.authenticated) {
          const userExists = data.user?.temp === undefined;
          if (userExists) {
            router.push("/AddItem");
          } else {
            router.push("/create-profile");
          }
          return;
        } else if (data.error === "Token expired" || data.error === "Invalid token"   ) {
          // ล้าง MSAL และ cookies ถ้า token หมดอายุหรือไม่ถูกต้อง
          localStorage.clear(); 
          setIsLoading(false);
          await msalInstance.logoutRedirect({
            postLogoutRedirectUri: "/Login",
          });
          
          return;
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }

      // ถ้าไม่มี session, ตรวจสอบ MSAL
      try {
        await msalInstance.initialize();
        const currentAccounts = msalInstance.getAllAccounts();
        if (currentAccounts.length > 0) {
          // ลอง acquire token แบบ silent เพื่อตรวจสอบว่า session ยัง active
          try {
            const account = currentAccounts[0];
            await msalInstance.acquireTokenSilent({
              scopes: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
              account,
            });
            router.push("/callback/azure");
          } catch (silentError) {
            // ถ้า acquire token ล้มเหลว (เช่น token หมดอายุ) ล้าง MSAL และ redirect ไป login
            console.error("Silent token acquisition failed:", silentError);
            await msalInstance.logoutRedirect({
              postLogoutRedirectUri: "/Login",
            });
            localStorage.clear(); // หรือล้างเฉพาะ MSAL keys

            setError("เซสชัน MSAL หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            setIsLoading(false);
          }
          return;
        }

        const response = await msalInstance.handleRedirectPromise();
        if (response?.account) {
          msalInstance.setActiveAccount(response.account);
          router.push("/callback/azure");
          return;
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("MSAL Error:", err);
          setError(`Authentication failed: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async () => {
    if (isLoading) {
      setError("MSAL not ready. Please wait or refresh.");
      return;
    }

    setIsLoading(true);
    const loginRequest: RedirectRequest = {
      scopes: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
      prompt: "select_account",
      redirectUri: "http://localhost:3000/callback/azure",
    };

    try {
      console.log("Initiating login redirect to Azure AD with request:", loginRequest);
      await msalInstance.loginRedirect(loginRequest);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("MSAL Login Redirect Error:", err);
        setError(`Login initiation failed: ${err.message}`);
      } else {
        console.error("MSAL Login Redirect Error: Unexpected error", err);
        setError("Login initiation failed: Unknown error");
      }
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center p-8">Loading authentication...</div>;

  return (
    <div className="w-[680px] h-[440px] bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 flex">
      <div className="w-1/2 p-6 flex flex-col justify-between border-r">
        <div>
          <h2 className="text-blue-600 font-semibold text-sm">Login</h2>
          <h1 className="text-xl font-bold text-gray-800 mb-6">เข้าสู่ระบบ</h1>
        </div>
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="flex items-center justify-center bg-[#a782e8] text-white font-medium px-4 py-2 rounded space-x-2"
              disabled={isLoading}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_of_University_of_Phayao.svg/576px-Logo_of_University_of_Phayao.svg.png"
                alt="UP Logo"
                className="w-5 h-5"
              />
              <span>UP Office 365</span>
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <button className="w-48 bg-[#cce3e3] text-[#2b3e3e] font-semibold py-2 rounded mt-4 hidden">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
      <div className="w-1/2 flex flex-col justify-center items-center p-6 bg-[#e7f2f3]">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_of_University_of_Phayao.svg/576px-Logo_of_University_of_Phayao.svg.png"
          className="w-20 mb-4"
          alt="University Logo"
        />
        <h2 className="text-center text-sm text-gray-800 mb-2">
          <strong>General Education +</strong>
          <br />
          University of Phayao
        </h2>
        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        <button
          onClick={handleLogin}
          className="bg-[#5f41a3] text-white px-4 py-2 rounded text-sm mt-2"
          disabled={isLoading}
        >
          เข้าสู่ระบบด้วย UP Account
        </button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Copyright © 2022 Division of Educational Services
        </p>
      </div>
    </div>
  );
}