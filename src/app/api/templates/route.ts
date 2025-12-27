import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Fetch from Supabase
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Transform the data for the Frontend
    const templates = data.map((t: any) => {
      // Parse 'components' to find the actual message text
      let content = "No text preview available";
      let components = t.components;
      
      // Handle case where Supabase returns it as a string vs JSON object
      if (typeof components === 'string') {
        try { components = JSON.parse(components); } catch {}
      }

      // Find the BODY component which contains the message text
      if (Array.isArray(components)) {
        const body = components.find((c: any) => c.type === 'BODY' || c.text);
        if (body?.text) content = body.text;
      }

      // Normalize status (DB says "APPROVED", UI wants "Approved")
      let status = 'Pending';
      if (t.status === 'APPROVED') status = 'Approved';
      if (t.status === 'REJECTED') status = 'Rejected';

      return {
        id: t.id,
        name: t.name,
        category: t.category || 'MARKETING',
        language: t.language || 'en',
        status: status,
        content: content,
      };
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('[API/Templates] Error:', error);
    return NextResponse.json({ message: 'Failed to retrieve templates' }, { status: 500 });
  }
}