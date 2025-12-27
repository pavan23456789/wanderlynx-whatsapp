import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      status,
      created_at,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 🔒 UI SAFETY GUARANTEE
  const safeData = (data || []).map((conversation: any) => ({
    ...conversation,
    messages: Array.isArray(conversation.messages)
      ? conversation.messages
      : [],
  }));

  return NextResponse.json(safeData);
}
