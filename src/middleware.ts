import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Routes that need a LOGGED-IN USER (Dashboard)
const PROTECTED_DASHBOARD_API = [
  "/api/conversations",
  "/api/messages",
  "/api/contacts",
];

// 2. Routes that are PUBLIC or use API KEYS (Partner API)
const PUBLIC_OR_KEY_API = [
  "/api/v1/messages/send",
];

export async function middleware(req: any) {
  const url = req.nextUrl.pathname;

  // STEP A: Allow Partner API to bypass User Auth
  if (PUBLIC_OR_KEY_API.some((p) => url.startsWith(p))) {
    return NextResponse.next(); 
    // We don't check for a User here because the API route 
    // itself will check the 'x-api-key' header later.
  }

  // STEP B: Only run User Auth for Dashboard APIs
  if (!PROTECTED_DASHBOARD_API.some((p) => url.startsWith(p))) {
    return NextResponse.next();
  }

  // STEP C: Check for User Token (Dashboard only)
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return NextResponse.json({ error: "Unauthorized: Invalid User" }, { status: 401 });
  }

  return NextResponse.next();
}