import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client
 * Uses SERVICE ROLE because this is a server-only API
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ---------------------------------------------------
 * POST → Send WhatsApp template message
 * ---------------------------------------------------
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Reply API] Hit');

    const body = await req.json();
    console.log('[Reply API] Request body:', body);

    const { contactId, templateName, params } = body;

    // 1️⃣ Validate input
    if (!contactId || !templateName || !Array.isArray(params)) {
      return NextResponse.json(
        { error: 'Missing contactId, templateName or params' },
        { status: 400 }
      );
    }

    // 2️⃣ Fetch phone number from conversations table
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (convError || !conversation?.phone) {
      console.error('[Reply API] Phone not found');
      return NextResponse.json(
        { error: 'Phone number not found for contact' },
        { status: 404 }
      );
    }

    const phone = conversation.phone;
    console.log('[Reply API] Sending to phone:', phone);

    // 3️⃣ Build Meta payload
    const metaPayload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: params.map((p: string) => ({
              type: 'text',
              text: p,
            })),
          },
        ],
      },
    };

    console.log('[Reply API] Meta payload:', metaPayload);

    // 4️⃣ Send to Meta
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
    console.log('[Reply API] Meta response:', metaRes.status, metaText);

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: 'Meta API failed', details: metaText },
        { status: 500 }
      );
    }

    // 5️⃣ Save outbound message in DB
    await supabase.from('messages').insert({
      conversation_id: contactId,
      direction: 'outbound',
      body: `${templateName}: ${params.join(' ')}`,
    });

    // 6️⃣ Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: `${templateName}: ${params.join(' ')}`,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Reply API] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
