import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safeDate(value: any) {
  if (!value) return null;
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
    return NextResponse.json(
      { conversations: [], error: error.message },
      { status: 500 }
    );
  }

  const conversations = (data || []).map((c: any) => ({
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

  // 🔒 STRICT CONTRACT — what Inbox expects
  return NextResponse.json({
    conversations,
  });
}
