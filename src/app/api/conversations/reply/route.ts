import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactId, text, templateParams } = body;

    if (!contactId || !text) {
      return NextResponse.json(
        { error: 'Missing contactId or template name' },
        { status: 400 }
      );
    }

    /**
     * 1️⃣ Fetch phone number from DB
     */
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (convError || !conversation?.phone) {
      return NextResponse.json(
        { error: 'Phone number not found for contact' },
        { status: 404 }
      );
    }

    const phone = conversation.phone;

    /**
     * 2️⃣ Send template to Meta
     */
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
                parameters: (templateParams || []).map((p: string) => ({
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
      console.error('Meta error:', err);
      return NextResponse.json(
        { error: 'Meta API failed', details: err },
        { status: 500 }
      );
    }

    /**
     * 3️⃣ Save outbound message
     */
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      body: `${text}: ${templateParams.join(' | ')}`,
    });

    if (msgError) throw msgError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Send template error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
