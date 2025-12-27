import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      phone,
      name,
      status,
      last_message,
      last_message_at,
      updated_at,
      messages (
        id,
        content,
        direction,
        created_at
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize messages
  const safe = (data || []).map((c: any) => ({
    ...c,
    messages: Array.isArray(c.messages) ? c.messages : [],
  }));

  // 🔥 CRITICAL COMPATIBILITY FIX
  // Return an array, but ALSO expose conversations on it
  const response: any = [...safe];
  response.conversations = response;

  return NextResponse.json(response);
}
