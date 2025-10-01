"use client";

import { useEffect, useState } from "react";
import { RedirectRequest, InteractionRequiredAuthError } from "@azure/msal-browser";
import { useRouter } from "next/navigation";
import { msalInstance } from "@/lib/msal";
import ".././globals.css";
import { useUser } from "@/contexts/UserContext";
import { IPublicClientApplication, AccountInfo } from "@azure/msal-browser";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showRightSection, setShowRightSection] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showLoginButton, setShowLoginButton] = useState(false);
  const [loginButtonVisible, setLoginButtonVisible] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const clearMsalCache = (msalInstance: IPublicClientApplication) => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("msal.")) {
        localStorage.removeItem(key);
      }
    });
    msalInstance.setActiveAccount(null);
  };

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
            router.push("/Craete_loanlist");
          } else {
            router.push("/create-profile");
          }
          return;
        } else if (data.error === "Token expired" || data.error === "Invalid token") {
          await clearMsalCache(msalInstance);
          setIsLoading(false);
          await msalInstance.logoutRedirect({
            postLogoutRedirectUri: "/Craete_loanlist",
          });
          return;
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }

      try {
        await msalInstance.initialize();
        const currentAccounts = msalInstance.getAllAccounts();
        if (currentAccounts.length > 0) {
          try {
            const account = currentAccounts[0];
            await msalInstance.acquireTokenSilent({
              scopes: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
              account,
            });
            router.push("/callback/azure");
          } catch (silentError) {
            console.error("Silent token acquisition failed:", silentError);
            if (silentError instanceof InteractionRequiredAuthError) {
              if (silentError.errorCode === "no_tokens_found" || silentError.errorCode === "token_renewal_error") {
                await clearMsalCache(msalInstance);
                await msalInstance.logoutRedirect({
                  postLogoutRedirectUri: "/Craete_loanlist",
                });
                setError("เซสชัน MSAL หมดอายุ (no tokens found) กรุณาเข้าสู่ระบบใหม่");
              } else {
                await msalInstance.acquireTokenRedirect({
                  scopes: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
                  account: currentAccounts[0],
                  redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback/azure`,
                });
              }
            } else {
              await clearMsalCache(msalInstance);
              await msalInstance.logoutRedirect({
                postLogoutRedirectUri: "/Craete_loanlist",
              });
              setError("เซสชัน MSAL หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            }
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

  useEffect(() => {
    if (showRightSection) {
      setShowLoginButton(false);
      setLoginButtonVisible(false);
      setVisible(true);
      setTimeout(() => setIsOpening(true), 10);
    } else {
      setIsOpening(false);
      const timer1 = setTimeout(() => {
        setVisible(false);
        setShowLoginButton(true);
        setLoginButtonVisible(false);
        setTimeout(() => setLoginButtonVisible(true), 50);
      }, 500);
      return () => clearTimeout(timer1);
    }
  }, [showRightSection]);

  const handleLogin = async () => {
    if (isLoading) {
      setError("MSAL not ready. Please wait or refresh.");
      return;
    }

    setIsLoading(true);
    const loginRequest: RedirectRequest = {
      scopes: ["openid", "profile", "email", "https://graph.microsoft.com/User.Read"],
      prompt: "select_account",
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/callback/azure`,
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

  const handleLoginButtonClick = () => {
    setLoginButtonVisible(false);
    setTimeout(() => {
      setShowLoginButton(false);
      setShowRightSection(true);
    }, 300);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none min-h-screen"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0) 10%, rgba(0,0,0,0.5) 90%)",
        }}
      ></div>
      {/* Overlay เบลอ */}
      <div className="absolute inset-0 bg-white/1 backdrop-blur-[2px] z-0 min-h-screen"></div>
      {/* Container */}
      {visible && (
        <div
          className={`relative bg-white shadow-lg rounded-md overflow-hidden z-10 flex flex-col md:flex-row transition-all duration-500 ease-in-out w-full max-w-[680px] ${
            showRightSection
              ? isOpening
                ? "max-h-[440px] opacity-100 origin-bottom scale-y-100"
                : "max-h-0 opacity-0 origin-top scale-y-0"
              : "max-h-0 opacity-0 origin-top scale-y-100"
          }`}
          style={{ transformOrigin: showRightSection ? "bottom" : "top" }}
        >
          {/* Left Section */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4 md:p-6 bg-[#f4f4f4]">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Logo_of_University_of_Phayao.svg/576px-Logo_of_University_of_Phayao.svg.png"
              className="w-16 sm:w-20 mb-3 sm:mb-4"
              alt="UP Logo"
            />
            <h2 className="text-center text-sm sm:text-base text-gray-800 mb-2 leading-snug">
              <strong>General Education +</strong>
              <br />
              University of Phayao
            </h2>
            <button
              onClick={handleLogin}
              className="bg-[#5f41a3] text-white px-4 py-2 rounded text-sm sm:text-base mt-2 transition duration-200 ease-in-out hover:bg-[#4b3289] hover:scale-105 cursor-pointer"
              disabled={isLoading}
            >
              เข้าสู่ระบบด้วย UP Account
            </button>
            {error && <p className="text-red-500 text-xs sm:text-sm mt-4 text-center">{error}</p>}

          </div>
          {/* Right Section */}
          <div className="relative w-full md:w-1/2 flex justify-center items-center h-52 sm:h-56 md:h-auto hidden md:flex">
            <img src="/right.jpg" className="w-full h-full object-cover rounded-r-md md:rounded-none" alt="UP" />
          </div>
          {/* Close Button */}
          <button
            onClick={() => setShowRightSection(false)}
            className="absolute top-2 right-2 text-gray-600 text-2xl  w-7 h-7 flex items-center justify-center transition duration-200 ease-in-out hover:text-red-500 hover:scale-110 z-20 cursor-pointer"
            aria-label="ปิด"
          >
            x
          </button>
        </div>
      )}
      {/* ปุ่ม เข้าสู่ระบบ พร้อม animation */}
      {showLoginButton && (
        <div
          className={`absolute bottom-4 left-0 right-0 flex justify-center px-4 sm:px-0 z-10 transition-opacity duration-300 ease-in-out ${
            loginButtonVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={handleLoginButtonClick}
            className="bg-[#5f41a3] text-white px-6 py-3 rounded text-base shadow-lg hover:bg-[#4b3289] hover:scale-105 transition duration-200 ease-in-out max-w-full sm:max-w-xs cursor-pointer"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      )}
    </div>
  );
}