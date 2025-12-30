import { NextResponse } from "next/server";

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;

  // 1. PUBLIC BYPASS
  // Allow WhatsApp Webhooks, Partner API (v1), AND Template Syncing to pass
  // This fixes the "Sync Error" on the Templates page.
  if (
    pathname.startsWith("/api/whatsapp/webhook") || 
    pathname.startsWith("/api/v1/") || 
    pathname.startsWith("/api/templates") // ✅ Added to unblock Template Sync
  ) {
    return NextResponse.next();
  }

  // 2. INTERNAL API PROTECTION
  // Protects dashboard routes like /api/conversations, /api/logs
  if (pathname.startsWith("/api/")) {
    const allCookies = req.cookies.getAll();
    
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