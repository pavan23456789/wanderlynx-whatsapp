import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ accept frontend payload names
    const contactId = body.contactId;
    const text = body.templateName; // FIX
    const templateParams = body.params || []; // FIX

    if (!contactId || !text) {
      return NextResponse.json(
        { error: 'Missing contactId or template name' },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch phone number
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (convError || !conversation?.phone) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    const phone = conversation.phone;

    // 2️⃣ Send to Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: text,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: templateParams.map((p: string) => ({
                  type: 'text',
                  text: p,
                })),
              },
            ],
          },
        }),
      }
    );

    if (!metaRes.ok) {
      const err = await metaRes.text();
      console.error('Meta API error:', err);
      return NextResponse.json(
        { error: 'Meta API failed', details: err },
        { status: 500 }
      );
    }

    // 3️⃣ Save message locally
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      body: `${text}: ${templateParams.join(' | ')}`,
    });

    if (msgError) throw msgError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reply API error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
