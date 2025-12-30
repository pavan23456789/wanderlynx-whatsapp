import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Total Lifetime API Messages
  const { count: total } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'api_tool');

  // 2. Messages sent in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: last24h } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'api_tool')
    .gt('created_at', yesterday);

  return NextResponse.json({ total: total || 0, last24h: last24h || 0 });
}