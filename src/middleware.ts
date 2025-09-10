// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  console.log("Middleware triggered. URL:", req.url, "Token:", token);
  const { pathname } = req.nextUrl;

  // ข้อยกเว้น: อนุญาตให้ผ่านโดยไม่ตรวจสอบ
  const publicPaths = ["/Login", "/callback/azure"];
  if (publicPaths.includes(req.nextUrl.pathname)) {
    console.log("Skipping middleware for public path:", req.nextUrl.pathname);
    return NextResponse.next();
  }

    if (pathname === "/" && !token) {
    return NextResponse.redirect(new URL("/Login", req.url));
  }
  
  // ถ้าไม่มี token ให้ redirect ไป /Login
  if (!token) {
    console.log("No token found, redirecting to /Login.");
    // ป้องกัน redirect loop โดยตรวจสอบว่าไม่ใช่ callback จาก MSAL
    if (req.nextUrl.pathname !== "/callback/azure") {
      return NextResponse.redirect(new URL("/Login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};