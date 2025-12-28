import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // 1. Get Recipient Phone
    const { data: conversation } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (!conversation) return NextResponse.json({ error: 'No phone found' }, { status: 404 });

    // 2. Prepare Meta Payload (Handles both Text & Templates)
    const metaPayload: any = {
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

    // 3. Send to Meta 🚀
    const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await res.json();
    if (!res.ok) return NextResponse.json(metaData, { status: 500 });

    // 4. SAVE TO DB (Crucial Step: This makes it appear in your dashboard!)
    const contentToSave = templateName ? `Template sent: ${templateName}` : text;

    await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      content: contentToSave,
      status: 'sent',
      whatsapp_id: metaData.messages?.[0]?.id,
    });

    // 5. Update Conversation timestamp
    await supabase.from('conversations').update({
        last_message: contentToSave,
        last_message_at: new Date().toISOString(),
    }).eq('id', contactId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}