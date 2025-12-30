import { NextResponse } from "next/server";

export function middleware(req: any) {
  const pathname = req.nextUrl.pathname;

  // 1. ALLOW WhatsApp Webhook (Priority Fix for image_c067d9.png)
  // Meta/WhatsApp servers don't have your cookies or tokens. 
  // We must exempt this path to receive incoming messages.
  if (pathname.startsWith("/api/whatsapp/webhook")) {
    return NextResponse.next();
  }

  // 2. ALWAYS allow the Partner API (v1) to pass
  // Security for these endpoints is handled via 'x-api-key' in the route file.
  if (pathname.startsWith("/api/v1/")) {
    return NextResponse.next();
  }

  // 3. Protect all other internal dashboard APIs (e.g., /api/conversations, /api/logs)
  if (pathname.startsWith("/api/")) {
    
    // Check for a Supabase auth cookie (Used by the browser dashboard)
    const hasSessionCookie = req.cookies.getAll().some((cookie: any) => 
      cookie.name.includes("auth-token") || cookie.name.startsWith("sb-")
    );

    // Check for an Authorization header (Used by our 'authFetch' helper)
    const hasAuthHeader = req.headers.get("authorization");

    // If either credential exists, allow the request to proceed
    if (hasSessionCookie || hasAuthHeader) {
      return NextResponse.next();
    }

    // Otherwise, block access to prevent unauthorized data leaks
    console.log(`[Middleware] Blocked unauthorized access to: ${pathname}`);
    return NextResponse.json(
      { error: "Unauthorized access to internal API" }, 
      { status: 401 }
    );
  }

  // Allow all other non-API requests (static files, page routing, etc.)
  return NextResponse.next();
}