import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: any) {
  const url = req.nextUrl.pathname;

  // 1. EXEMPTION: Allow the Partner API to bypass user authentication
  // The route itself will check for the 'x-api-key' header later.
  if (url.startsWith("/api/v1/messages/send")) {
    return NextResponse.next();
  }

  // 2. PROTECTION: Define which routes need a logged-in user
  const protectedDashboardRoutes = ["/api/conversations", "/api/messages", "/api/contacts"];
  
  if (protectedDashboardRoutes.some((p) => url.startsWith(p))) {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user session token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
  }

  return NextResponse.next();
}