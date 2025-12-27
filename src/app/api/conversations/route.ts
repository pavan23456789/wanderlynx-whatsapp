import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// helper to safely handle dates
function safeDate(value: any) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

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

  const safeConversations = (data || []).map((c: any) => ({
    ...c,
    last_message_at: safeDate(c.last_message_at),
    updated_at: safeDate(c.updated_at),
    messages: Array.isArray(c.messages)
      ? c.messages.map((m: any) => ({
          ...m,
          created_at: safeDate(m.created_at),
        }))
      : [],
  }));

  return NextResponse.json({
    conversations: safeConversations,
  });
}
