import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const pathname = req.nextUrl.pathname
  const isStaticAsset = /\.[^/]+$/.test(pathname)
  if (isStaticAsset) return

  const isLoggedIn = !!req.auth
  const isAuthPage = pathname.startsWith("/api/auth")
  const isPublicPage = ["/", "/privacy", "/terms", "/pricing"].includes(pathname) || pathname.startsWith("/share/")

  if (!isLoggedIn && !isPublicPage && !isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
