import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
