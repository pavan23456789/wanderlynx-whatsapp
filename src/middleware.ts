import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROTECTED_API = [
  "/api/conversations",
  "/api/messages",
  "/api/send-message",
  "/api/contacts",
];

export async function middleware(req: any) {
  const url = req.nextUrl.pathname;

  // Only protect these backend APIs
  if (!PROTECTED_API.some((p) => url.startsWith(p))) {
    return NextResponse.next();
  }

  // get auth token sent from frontend
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase.auth.getUser(token);

  if (!data?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
