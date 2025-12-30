import { NextResponse } from "next/server";

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;

  // 1. ALLOW WhatsApp Webhook (Exempt from all checks to allow incoming messages)
  // Incoming messages from Meta/WhatsApp do not have cookies or your auth tokens.
  if (pathname.startsWith("/api/whatsapp/webhook")) {
    return NextResponse.next();
  }

  // 2. ALWAYS allow the Partner API (v1) to pass the middleware
  // The code inside the route will check the 'x-api-key' later.
  if (pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // 3. Protect all other internal dashboard APIs
  if (pathname.startsWith("/api/")) {
    
    // Check for a Supabase auth cookie (Used by your browser/dashboard)
    const hasSessionCookie = req.cookies.getAll().some((cookie: any) => 
      cookie.name.includes("auth-token") || cookie.name.startsWith("sb-")
    );

    // Check for an Authorization header (Used by Postman/authFetch)
    const hasAuthHeader = req.headers.get("authorization");

    // If we have either one, let the request through
    if (hasSessionCookie || hasAuthHeader) {
      return NextResponse.next();
    }

    // Otherwise, block the request
    console.log(`[Middleware] Blocked unauthorized access to: ${pathname}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}