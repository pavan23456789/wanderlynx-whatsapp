import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch the last 1000 logs from your database table instead of a file
    const { data, error } = await supabase
      .from('event_logs') // Ensure you have this table in Supabase
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("[API Logs] Database Error:", err.message);
    return NextResponse.json({ error: "Failed to retrieve logs from database" }, { status: 500 });
  }
}