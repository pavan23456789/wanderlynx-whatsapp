import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Setup Supabase Client
// We use the SERVICE_ROLE key because the webhook needs "Admin" rights 
// to write to the DB without being a logged-in user.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 2. GET Request: Used by Meta to verify your webhook URL
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Check if the token matches what you set in Vercel & Meta
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('[Webhook] Verification failed: Token mismatch');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. POST Request: Used by Meta to send you new messages
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[Webhook] Incoming payload:', JSON.stringify(payload));

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // If it's not a message (e.g., status update), just say OK
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const from = message.from; // Phone number without +
    const phone = `+${from}`;  // Phone number with + (Standard format)
    
    // Extract text from text message or button reply
    const text = message.text?.body || message.button?.text || '[Media/Other]';

    // A. Find or Create the Conversation
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
          name: `User ${from.slice(-4)}`, // Default name
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
      // Update existing conversation timestamp
      await supabase
        .from('conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    // B. Save the Message (THE FIX IS HERE: 'content' instead of 'body')
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      content: text, // <--- MATCHES YOUR DATABASE COLUMN NAME
    });

    if (msgError) {
      console.error('[Webhook] Message insert failed', msgError);
    } else {
      console.log('[Webhook] Message saved successfully');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Webhook] Critical Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}