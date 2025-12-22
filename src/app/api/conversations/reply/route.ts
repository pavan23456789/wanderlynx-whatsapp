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
     * 1️⃣ Fetch conversation (we need phone number)
     */
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', contactId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    /**
     * 2️⃣ Send WhatsApp template via Meta
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
          to: conversation.phone,
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

    const metaJson = await metaRes.json();

    if (!metaRes.ok) {
      console.error('Meta error:', metaJson);
      return NextResponse.json(
        { error: metaJson },
        { status: 500 }
      );
    }

    /**
     * 3️⃣ Save outbound message
     */
    const messageText =
      `${text}: ${templateParams?.join(' | ') || ''}`;

    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: contactId,
        body: messageText,
        direction: 'outbound',
      });

    if (msgError) throw msgError;

    /**
     * 4️⃣ Update conversation last message
     */
    await supabase
      .from('conversations')
      .update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[reply API error]', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
