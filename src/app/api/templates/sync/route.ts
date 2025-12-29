import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize with Service Role to bypass RLS and allow deletions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST() {
  try {
    // 1. Fetch the absolute "Source of Truth" from Meta
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ID}/message_templates?limit=100`,
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );

    const data = await response.json();
    if (!data.data) throw new Error(data.error?.message || "Meta API Error");

    // 2. Map Meta IDs to identify what should stay
    const liveTemplateIds = data.data.map((meta: any) => meta.id.toString());
    
    const processedTemplates = data.data.map((meta: any) => ({
      id: meta.id.toString(),
      name: meta.name,
      category: meta.category,
      language: meta.language,
      status: meta.status, 
      components: meta.components 
    }));

    // 3. Upsert: Add new or Update existing templates
    const { error: upsertError } = await supabase
      .from('templates')
      .upsert(processedTemplates, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    // 4. Cleanup: Remove local templates that are no longer in Meta's live list
    // This solves your issue of deleted templates still showing up.
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .not('id', 'in', `(${liveTemplateIds.join(',')})`);

    if (deleteError) {
      console.error("Cleanup sync error:", deleteError);
      // We don't fail the whole request here since data was updated
    }

    return NextResponse.json({ 
      success: true, 
      count: processedTemplates.length,
      message: "Sync and cleanup successful." 
    });

  } catch (error: any) {
    console.error("[Sync API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}