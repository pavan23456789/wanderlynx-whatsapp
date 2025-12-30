import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: any) {
  const url = req.nextUrl.pathname;

  // 1. ALWAYS ALLOW Partner API & Webhooks
  if (url.startsWith("/api/v1/") || url.includes("webhook")) {
    return NextResponse.next();
  }

  // 2. ONLY PROTECT specific dashboard data APIs
  const protectedPaths = ["/api/conversations", "/api/messages", "/api/contacts"];
  if (protectedPaths.some(path => url.startsWith(path))) {
    
    // Get the token from headers
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // If no token, return 401 but with a clear message for debugging
      return NextResponse.json({ error: "No token found in request headers" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // VITAL: Revalidate the user with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Session invalid or expired" }, { status: 401 });
    }
  }

  return NextResponse.next();
}