"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { msalInstance } from "@/lib/msal";
import "../../globals.css";
import { useUser } from "@/contexts/UserContext";
import { IPublicClientApplication } from "@azure/msal-browser";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function AzureCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...");
  const { setUser } = useUser();

  const clearMsalCache = (msalInstance: IPublicClientApplication) => {
    // ล้าง cache ของ MSAL ใน localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("msal.")) {
        localStorage.removeItem(key);
      }
    });

    // ล้าง active account
    msalInstance.setActiveAccount(null);
  };
  useEffect(() => {
    const handleResponse = async () => {
      setIsLoading(true);
      try {
        await msalInstance.initialize();
        console.log(
          "MSAL initialized successfully at",
          new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
        );

        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
          msalInstance.setActiveAccount(response.account);

          const accessTokenResponse = await msalInstance.acquireTokenSilent({
            scopes: ["https://graph.microsoft.com/User.Read"],
            account: response.account,
          });
          const accessToken = accessTokenResponse.accessToken;

          const graphResponse = await fetch(
            "https://graph.microsoft.com/v1.0/me",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!graphResponse.ok)
            throw new Error(`Graph API error: ${graphResponse.statusText}`);
          const graphData = await graphResponse.json();

          const apiResponse = await fetch("/api/auth/process-msal-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accountInfo: response.account,
              idTokenClaims: response.idTokenClaims,
              graphData: graphData,
              accessToken,
            }),
          });

          if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("API Response Error Text:", errorText);
            throw new Error(`API error: ${apiResponse.status} - ${errorText}`);
          }

          const apiResult = await apiResponse.json();
          if (apiResult.success) {
            const { userExists, initialData } = apiResult;

            const userRes = await fetch("/api/me", { credentials: "include" });
            if (userRes.ok) {
              const userData = await userRes.json();
              setUser(userData.user);
            }

            if (typeof window !== "undefined" && window.location) {
              window.location.href = userExists
                ? "/Craete_loanlist"
                : `/create-profile?data=${encodeURIComponent(JSON.stringify(initialData))}`;
            }
            setDebugInfo(
              `Redirected to ${userExists ? "/Craete_loanlist" : "/create-profile"}`
            );
          } else {
            throw new Error(apiResult.error || "API processing failed");
          }
        } else {
          console.log("No redirect response, checking active account");
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            msalInstance.setActiveAccount(account);
            try {
              // Acquire silent สำหรับ User.Read
              const accessTokenResponse = await msalInstance.acquireTokenSilent(
                {
                  scopes: ["https://graph.microsoft.com/User.Read"],
                  account,
                }
              );
              const accessToken = accessTokenResponse.accessToken;

              // Fetch graph data
              const graphResponse = await fetch(
                "https://graph.microsoft.com/v1.0/me",
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );
              if (!graphResponse.ok)
                throw new Error(`Graph API error: ${graphResponse.statusText}`);
              const graphData = await graphResponse.json();

              // Get idTokenClaims from account
              const idTokenClaims = account.idTokenClaims;

              // Call backend API to refresh session
              const apiResponse = await fetch("/api/auth/process-msal-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accountInfo: account,
                  idTokenClaims,
                  graphData,
                  accessToken,
                }),
              });

              if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error("API Response Error Text:", errorText);
                throw new Error(
                  `API error: ${apiResponse.status} - ${errorText}`
                );
              }

              const apiResult = await apiResponse.json();
              if (apiResult.success) {
                const { userExists, initialData } = apiResult;

                const userRes = await fetch("/api/me", {
                  credentials: "include",
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  setUser(userData.user);
                }

                if (typeof window !== "undefined" && window.location) {
                  window.location.href = userExists
                    ? "/Craete_loanlist"
                    : `/create-profile?data=${encodeURIComponent(JSON.stringify(initialData))}`;
                }
                setDebugInfo(
                  `Redirected to ${userExists ? "/Craete_loanlist" : "/create-profile"}`
                );
              } else {
                throw new Error(apiResult.error || "API processing failed");
              }
            } catch (silentError) {
              console.error(
                "Silent token acquisition or API failed:",
                silentError
              );
              // Clear และ logout สำหรับทุก error
              await clearMsalCache(msalInstance);
              await msalInstance.logoutRedirect({
                postLogoutRedirectUri: "/Craete_loanlist",
              });
              setError("เซสชันหมดอายุหรือเกิดข้อผิดพลาด กรุณาเข้าสู่ระบบใหม่");
            }
          } else {
            console.log(
              "No redirect response or accounts, redirecting to login"
            );
            setDebugInfo("No redirect response or accounts detected.");
            window.location.href = "/Login";
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Callback Error:", err);
          setError(`Authentication failed: ${err.message}`);
          setDebugInfo(`Error: ${err.message}`);
        } else {
          console.error("Callback Error: Unexpected error", err);
          setError("Authentication failed: Unknown error");
          setDebugInfo("Error: Unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [router, setUser]);

  if (isLoading) {
    return (
      <>
        <FullScreenLoader />
        <div
          className="absolute inset-0 pointer-events-none min-h-screen"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0) 10%, rgba(0,0,0,0.5) 90%)",
          }}
        ></div>
        <div className="absolute inset-0 bg-white/1 backdrop-blur-[2px] z-0 min-h-screen"></div>
      </>
    );
  }
  if (error)
    return (
      <div className="text-center p-8">
        <h1 className="text-xl text-red-500">เกิดข้อผิดพลาดในการเข้าสู่ระบบ</h1>
        <p className="text-red-700 mt-2">{error}</p>
        <p className="text-gray-600 mt-2">Debug Info: {debugInfo}</p>
        <button
          onClick={() => router.push("/Login")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          กลับไปยังหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  return (
    <>
      <FullScreenLoader />
      <div
        className="absolute inset-0 pointer-events-none min-h-screen"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0) 10%, rgba(0,0,0,0.5) 90%)",
        }}
      ></div>
      <div className="absolute inset-0 bg-white/1 backdrop-blur-[2px] z-0 min-h-screen"></div>
    </>
  );
}
