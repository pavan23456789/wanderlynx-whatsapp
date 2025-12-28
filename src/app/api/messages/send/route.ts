import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log('[API] Starting Send Request...'); // 🔍 LOG 1

  // 1. Check Credentials
  const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!TOKEN || !PHONE_ID) {
    console.error('[API] CRITICAL: Missing WhatsApp Env Vars!', { hasToken: !!TOKEN, hasPhoneId: !!PHONE_ID });
    return NextResponse.json({ error: 'Server Config Error: Missing WhatsApp Credentials' }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log('[API] Request Body:', JSON.stringify(body)); // 🔍 LOG 2

    const { contactId, text, templateName, params } = body;

    // 2. Get Phone Number
    const { data: conversation, error: dbError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (dbError || !conversation) {
      console.error('[API] DB Error or Conversation not found:', dbError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('[API] Found Phone:', conversation.phone); // 🔍 LOG 3

    // 3. Prepare Payload
    let metaPayload: any = {
      messaging_product: 'whatsapp',
      to: conversation.phone,
    };

    if (templateName) {
      metaPayload.type = 'template';
      metaPayload.template = {
        name: templateName,
        language: { code: 'en_US' },
        components: [{ type: 'body', parameters: params?.map((p: string) => ({ type: 'text', text: p })) || [] }],
      };
    } else {
      metaPayload.type = 'text';
      metaPayload.text = { body: text };
    }

    // 4. Send to Meta
    console.log('[API] Sending to Meta...'); // 🔍 LOG 4
    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await res.json();
    console.log('[API] Meta Response:', JSON.stringify(metaData)); // 🔍 LOG 5

    if (!res.ok) {
      // THIS IS WHERE THE ERROR IS COMING FROM
      return NextResponse.json({ error: metaData.error?.message || 'Meta API Failed' }, { status: 500 });
    }

    // 5. Save to DB
    await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      content: templateName ? `Template sent: ${templateName}` : text,
      status: 'sent',
      whatsapp_id: metaData.messages?.[0]?.id,
    });

    // 6. Update Conversation
    await supabase.from('conversations').update({
        last_message: templateName ? `Template: ${templateName}` : text,
        last_message_at: new Date().toISOString(),
    }).eq('id', contactId);

    console.log('[API] Success!'); // 🔍 LOG 6
    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('[API] Uncaught Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}