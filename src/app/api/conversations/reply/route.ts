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

    if (!contactId || !text || !Array.isArray(templateParams)) {
      return NextResponse.json(
        { error: 'Missing or invalid payload' },
        { status: 400 }
      );
    }

    /**
     * 1️⃣ Fetch phone number
     */
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

    /**
     * 2️⃣ Normalize phone (Meta requires NO +)
     */
    const phone = conversation.phone.replace(/\D/g, '');

    /**
     * 3️⃣ Send template to Meta
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
                parameters: templateParams.map((p: string) => ({
                  type: 'text',
                  text: String(p),
                })),
              },
            ],
          },
        }),
      }
    );

    if (!metaRes.ok) {
      const metaError = await metaRes.json();
      console.error('META ERROR:', JSON.stringify(metaError, null, 2));

      return NextResponse.json(
        { error: 'Meta API failed', metaError },
        { status: 500 }
      );
    }

    /**
     * 4️⃣ Save outbound message
     */
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      body: `${text} → ${templateParams.join(' | ')}`,
    });

    if (msgError) {
      console.error('DB insert error:', msgError);
      throw msgError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Send template error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
}
