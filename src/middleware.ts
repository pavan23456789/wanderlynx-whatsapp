import { NextResponse } from "next/server";

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;

  // 1. PUBLIC BYPASS
  // WhatsApp webhooks (Meta) and Partner API (v1) must always be accessible
  if (pathname.startsWith("/api/whatsapp/webhook") || pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // 2. INTERNAL API PROTECTION
  // Protects dashboard routes like /api/conversations, /api/logs, /api/templates
  if (pathname.startsWith("/api/")) {
    const allCookies = req.cookies.getAll();
    
    // FIX: Added '(c: any)' to resolve the TypeScript error
    // Check for ANY valid Supabase session cookie prefix
    const hasAuth = allCookies.some((c: any) => 
      c.name.includes("auth-token") || 
      c.name.startsWith("sb-") || 
      c.name.includes("supabase") ||
      c.name.includes("session")
    ) || !!req.headers.get("authorization");

    if (hasAuth) {
      return NextResponse.next();
    }

    // Log the 401 for Vercel debugging
    console.log(`[Middleware] 401 Blocked Access to: ${pathname}`);
    return NextResponse.json(
      { error: "Unauthorized access to internal API" }, 
      { status: 401 }
    );
  }

  // Allow all other requests (static assets, page routing, etc.)
  return NextResponse.next();
}