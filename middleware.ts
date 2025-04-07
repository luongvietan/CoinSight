// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Những đường dẫn không cần xác thực
const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/api/", // API routes không cần xác thực thông qua middleware này (sẽ kiểm tra riêng)
];

const isPublicPath = (path: string) => {
  return publicPaths.some(
    (publicPath) =>
      path.startsWith(publicPath) ||
      path.includes("/_next/") ||
      path.includes("/favicon.ico")
  );
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tạo response và thêm security headers
  let response = NextResponse.next();

  // Security headers (excluding CSP which is handled in next.config.mjs)
  const headers = response.headers;
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Kiểm tra xác thực cho các đường dẫn không phải public
  const isPublic = isPublicPath(pathname);
  const token = request.cookies.get("auth-token")?.value;

  // Nếu là đường dẫn private mà chưa đăng nhập (không có token)
  if (!isPublic && !token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Nếu đã đăng nhập mà truy cập vào trang auth
  if (
    token &&
    (pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
