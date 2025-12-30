import { NextResponse } from "next/server";

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;

  // 1. PUBLIC BYPASS: WhatsApp Webhooks (Meta)
  // Essential so Meta can send incoming messages to your system
  if (pathname.startsWith("/api/whatsapp/webhook")) {
    return NextResponse.next();
  }

  // 2. PUBLIC BYPASS: Partner API (v1)
  // Pavan's tool uses 'x-api-key', so we bypass cookie checks here
  if (pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // 3. PROTECTED INTERNAL APIs (Inbox, Logs, Stats)
  if (pathname.startsWith("/api/")) {
    
    // Improved cookie detection for Supabase production environments
    const allCookies = req.cookies.getAll();
    const hasSessionCookie = allCookies.some((cookie: any) => 
      cookie.name.includes("auth-token") || 
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("supabase-auth") ||
      cookie.name.includes("session")
    );

    // Check for Authorization header (Used by 'authFetch')
    const hasAuthHeader = !!req.headers.get("authorization");

    // Allow the request if either a cookie or auth header is present
    if (hasSessionCookie || hasAuthHeader) {
      return NextResponse.next();
    }

    // Log the blockage for debugging in Vercel
    console.log(`[Middleware] 401 Blocked: ${pathname}`);
    return NextResponse.json(
      { error: "Unauthorized access to internal API" }, 
      { status: 401 }
    );
  }

  // Allow all page navigations and static assets
  return NextResponse.next();
}