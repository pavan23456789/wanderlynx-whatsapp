import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client
 * Uses SERVICE ROLE because webhook must write to DB
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ---------------------------------------------------
 * GET → Meta webhook verification
 * ---------------------------------------------------
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log('[Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('[Webhook] Verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * ---------------------------------------------------
 * POST → Incoming WhatsApp messages
 * ---------------------------------------------------
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[Webhook] Incoming payload:', JSON.stringify(payload));

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    if (!message) {
      // Delivery receipts, status updates, etc.
      return NextResponse.json({ ok: true });
    }

    const from = message.from; // phone number WITHOUT +
    const phone = `+${from}`;

    const text =
      message.text?.body ||
      message.button?.text ||
      '[Unsupported message]';

    /**
     * 1️⃣ Find or create conversation
     */
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!conversation) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          phone,
          name: `WhatsApp ${phone}`,
          last_message: text,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Webhook] Conversation insert failed', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
      }

      conversation = data;
    } else {
      await supabase
        .from('conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    /**
     * 2️⃣ Store inbound message
     */
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      body: text,
    });

    console.log('[Webhook] Message saved');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
