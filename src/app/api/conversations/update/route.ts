import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase with SERVICE ROLE KEY (Admin Privileges)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, conversationId, value } = body;

    console.log(`[API] Updating conversation ${conversationId}: ${action} -> ${value}`);

    let updateData = {};

    // 1. Handle Assignment
    if (action === 'assign') {
        updateData = { assigned_to: value };
    } 
    // 2. Handle Status Change (Resolve/Open)
    else if (action === 'status') {
        // Map UI 'Resolved' to DB 'closed'
        const dbStatus = value === 'Resolved' ? 'closed' : 'open';
        updateData = { status: dbStatus };
    }
    // 3. Handle Unread Clear
    else if (action === 'unread') {
        updateData = { unread: 0 };
    }

    // Perform the Update
    const { error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId);

    if (error) {
        console.error('[API] Update Error:', error);
        throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}