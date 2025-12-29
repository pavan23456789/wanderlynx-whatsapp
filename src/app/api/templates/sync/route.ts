import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ID}/message_templates?limit=100`,
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );

    const data = await response.json();
    if (!data.data) throw new Error(data.error?.message || "Failed to fetch from Meta");

    const processedTemplates = data.data.map((meta: any) => ({
      id: meta.id,
      name: meta.name,
      category: meta.category,
      language: meta.language,
      status: meta.status, // Database stores raw Meta status (e.g., APPROVED)
      components: meta.components, // Store full JSON for your GET route to parse
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('templates')
      .upsert(processedTemplates, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true, count: processedTemplates.length });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}