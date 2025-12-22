import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  console.log('Reply API hit');

  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { contactId, text, templateParams } = body;

    if (!contactId || !text) {
      console.error('Missing contactId or text');
      return NextResponse.json(
        { error: 'Missing contactId or template name' },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch phone number from conversations table
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (convError || !conversation?.phone) {
      console.error('Phone fetch error:', convError);
      return NextResponse.json(
        { error: 'Phone number not found for contact' },
        { status: 404 }
      );
    }

    const phone = conversation.phone;
    console.log('Sending to phone:', phone);

    // 2️⃣ Send template to Meta
    const metaPayload = {
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
    };

    console.log('Meta payload:', metaPayload);

    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaText = await metaRes.text();
    console.log('Meta response status:', metaRes.status);
    console.log('Meta response body:', metaText);

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: 'Meta API failed', details: metaText },
        { status: 500 }
      );
    }

    // 3️⃣ Save outbound message locally
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      body: `${text}: ${(templateParams || []).join(' | ')}`,
    });

    if (msgError) {
      console.error('Message insert error:', msgError);
      throw msgError;
    }

    console.log('Reply API success');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reply API crashed:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
