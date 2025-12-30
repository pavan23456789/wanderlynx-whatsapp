import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logMessageEvent } from '@/lib/logger'; // ✅ Correctly imported

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

    // --- TRACKER & DASHBOARD SYNC (The "Senior Dev" Fix) ---
    
    // A. Technical Log: This populates the "Recent Messages" list (image_c3174d.png)
    await logMessageEvent({
      idempotencyKey: body.idempotencyKey || result.messages?.[0]?.id,
      type: 'booking',
      status: 'SUCCESS',
      event: 'API Template Sent',
      recipient: body.to,
      details: { templateName: body.templateName, variables: body.variables }
    });

    // B. Conversation Management: Ensures contact appears in Inbox (image_c3176b.png)
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

    // C. Inbox & Usage Sync: This triggers the tracker count (image_c1c517.png)
    // IMPORTANT: 'type: api_tool' is the filter for your tracker cards.
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: `API Template: ${body.templateName}`, 
      direction: 'outbound',
      type: 'api_tool', 
      status: 'sent',
      metadata: { 
        template: body.templateName, 
        variables: body.variables,
        meta_id: result.messages?.[0]?.id 
      }
    });

    // D. Immediate UI Refresh: Pushes conversation to the top
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