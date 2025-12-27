import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure you have these env vars set in .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // We select specific columns and rename them to match the Frontend
  // Example: 'agent_id' becomes 'agentId'
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      phone,
      name,
      status,
      last_message,
      last_message_at,
      pinned,
      unread,
      assignedTo:assigned_to,
      messages (
        id,
        content,
        direction,
        created_at,
        status,
        type,
        agentId:agent_id
      )
    `)
    // 1. Sort conversations: Newest messages at the top of the list
    .order("last_message_at", { ascending: false })
    // 2. Sort messages: Oldest at the top (so you read down)
    .order("created_at", { foreignTable: "messages", ascending: true });

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json(
      { conversations: [], error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversations: data ?? [],
  });
}