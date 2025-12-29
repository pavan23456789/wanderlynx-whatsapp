import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the Service Role Key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST() {
  try {
    // 1. Fetch templates from Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ID}/message_templates?limit=100`,
      { 
        headers: { 
          Authorization: `Bearer ${ACCESS_TOKEN}` 
        } 
      }
    );

    const data = await response.json();
    
    // Check if Meta returned an error (e.g., token expired or wrong ID)
    if (!data.data) {
        throw new Error(data.error?.message || "Failed to fetch from Meta. Check your credentials.");
    }

    // 2. Map Meta format to match your Supabase table columns exactly
    // REMOVED 'updated_at' because it doesn't exist in your schema cache
    const processedTemplates = data.data.map((meta: any) => ({
      id: meta.id,
      name: meta.name,
      category: meta.category,
      language: meta.language,
      status: meta.status, // This will be 'APPROVED', 'REJECTED', etc.
      components: meta.components // Stores the JSON for the message body and buttons
    }));

    // 3. Upsert into Supabase (Update existing by ID, or Insert new)
    const { error } = await supabase
      .from('templates')
      .upsert(processedTemplates, { onConflict: 'id' });

    if (error) {
        console.error("Supabase Upsert Error:", error);
        throw error;
    }

    return NextResponse.json({ 
      success: true, 
      count: processedTemplates.length 
    });

  } catch (error: any) {
    console.error("[Sync API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}