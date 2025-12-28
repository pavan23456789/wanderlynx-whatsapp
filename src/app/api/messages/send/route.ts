import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, text, templateName, params } = body;

    // 2. Get the Recipient Phone Number
    const { data: conversation } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 3. Prepare the Meta Payload (Universal: Handles Text & Templates)
    let metaPayload: any = {
      messaging_product: 'whatsapp',
      to: conversation.phone,
    };

    if (templateName) {
      // --- TEMPLATE MODE ---
      metaPayload.type = 'template';
      metaPayload.template = {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: params?.map((p: string) => ({ type: 'text', text: p })) || [],
          },
        ],
      };
    } else {
      // --- TEXT MODE ---
      metaPayload.type = 'text';
      metaPayload.text = { body: text };
    }

    // 4. Send to Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      // Return the exact error from Meta so you know what went wrong (e.g., "Template not found")
      return NextResponse.json({ error: metaData.error?.message }, { status: 500 });
    }

    // 5. Save to Supabase (So it appears in your Dashboard)
    const contentToSave = templateName 
      ? `Template sent: ${templateName}` 
      : text;

    await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      content: contentToSave,
      status: 'sent',
      whatsapp_id: metaData.messages?.[0]?.id,
    });

    // 6. Update Conversation Timestamp
    await supabase.from('conversations').update({
        last_message: contentToSave,
        last_message_at: new Date().toISOString(),
    }).eq('id', contactId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}