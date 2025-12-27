import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT:
// - Uses service role key (server-side only)
// - Uses NEXT_PUBLIC_SUPABASE_URL (correct env var for Vercel)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
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
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // UI SAFETY: always return messages as an array
    const safeData = (data || []).map((conversation: any) => ({
      ...conversation,
      messages: Array.isArray(conversation.messages)
        ? conversation.messages
        : [],
    }));

    return NextResponse.json(safeData);
  } catch (err) {
    console.error("API crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
