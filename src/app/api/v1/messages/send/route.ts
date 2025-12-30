import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role to bypass RLS for administrative logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Must be 935339339662475

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = req.headers.get('x-api-key');

    // 1. VERIFY PARTNER API KEY
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('business_id')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      console.error("[Middleware] Blocked unauthorized API access attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. BUILD META PAYLOAD (Template Message)
    const metaPayload = {
      messaging_product: "whatsapp",
      to: body.to,
      type: "template",
      template: {
        name: body.templateName,
        language: { code: body.language || 'en_US' },
        components: [
          {
            type: "body",
            parameters: body.variables.map((val: string) => ({
              type: "text",
              text: val
            }))
          }
        ]
      }
    };

    // 3. SEND VIA META API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Meta API Error");

    // --- TRACKER & DASHBOARD SYNC (A-Z FIX) ---
    
    // A. Find or Create Conversation so it appears in the Dashboard Inbox
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('phone', body.to)
      .maybeSingle();

    let conversationId = conv?.id;

    if (!conversationId) {
      // Create a new conversation if this is a first-time contact
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ 
            phone: body.to, 
            name: body.to, 
            status: 'open',
            last_message_at: new Date().toISOString() 
        })
        .select()
        .single();
      
      if (convError) throw new Error("Failed to create conversation entry");
      conversationId = newConv?.id;
    }

    // B. Log to Database (The Tracker)
    // Tagged with 'api_tool' to differentiate from manual dashboard messages
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: `Template Sent: ${body.templateName}`, 
      direction: 'outbound',
      type: 'api_tool', // This is what the Usage Tracker UI filters for
      status: 'sent',
      metadata: { 
        template: body.templateName, 
        variables: body.variables,
        meta_id: result.messages?.[0]?.id 
      }
    });

    // C. Update Conversation Timestamp
    // This forces the chat to the top of the Inbox list for immediate visibility
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // --- END TRACKER LOGIC ---

    return NextResponse.json({ 
        success: true, 
        meta_id: result.messages?.[0]?.id,
        tracked: true 
    });

  } catch (error: any) {
    console.error("[API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}