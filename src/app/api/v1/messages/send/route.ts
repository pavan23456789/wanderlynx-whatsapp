import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logMessageEvent } from '@/lib/logger'; // ✅ Ensure this import exists

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = req.headers.get('x-api-key');

    // 1. Verify Partner API Key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('business_id')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Build and Send Meta Payload
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
            parameters: (body.variables || []).map((val: string) => ({
              type: "text",
              text: val
            }))
          }
        ]
      }
    };

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

    // --- NEW: SYNC TO DASHBOARD & TRACKER ---
    
    // A. Technical Log (For 'Event Logs' page)
    await logMessageEvent({
      idempotencyKey: body.idempotencyKey || result.messages?.[0]?.id,
      type: 'booking',
      status: 'SUCCESS',
      event: 'API Template Sent',
      recipient: body.to,
      details: { templateName: body.templateName, variables: body.variables }
    });

    // B. Find or Create Conversation (For 'Inbox' visibility)
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('phone', body.to)
      .maybeSingle();

    let conversationId = conv?.id;

    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ 
            phone: body.to, 
            name: body.to, 
            status: 'open',
            last_message_at: new Date().toISOString() 
        })
        .select()
        .single();
      conversationId = newConv?.id;
    }

    // C. Insert Message Bubble (For 'Inbox' and 'Usage Tracker')
    // type: 'api_tool' allows the Tracker Card to count this message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: `API Template: ${body.templateName}`, 
      direction: 'outbound',
      type: 'api_tool', 
      status: 'sent',
      metadata: { 
        template: body.templateName, 
        meta_id: result.messages?.[0]?.id 
      }
    });

    // D. Update the Conversation list to show the new message at the top
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

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