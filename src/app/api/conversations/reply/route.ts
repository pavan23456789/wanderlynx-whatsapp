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
     * 1. Send template to Meta
     * (You already have this working)
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
          to: body.phone,
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
      throw new Error(err);
    }

    /**
     * 2. SAVE MESSAGE LOCALLY (THIS IS THE MISSING PIECE)
     */
    const { error } = await supabase.from('messages').insert({
      contact_id: contactId,
      direction: 'outbound',
      content: `${text} → ${templateParams.join(' | ')}`,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
