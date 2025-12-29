import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// --- GET: Verification ---
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// --- POST: Handle Incoming Messages ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // console.log('[Webhook] Received POST:', JSON.stringify(body, null, 2));

    // 1. Check if it's a message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        // --- 2. Extract Data ---
        // Meta sends number WITHOUT + (e.g., 919988776655)
        const rawPhone = message.from; 
        const senderPhone = `+${rawPhone}`; 
        
        const textBody = message.text?.body || message.button?.text || '[Media/Other]';
        const senderName = value.contacts?.[0]?.profile?.name || senderPhone;
        const whatsappMsgId = message.id;

        console.log(`[Webhook] Processing message from ${senderPhone}: ${textBody}`);

        // --- 3. Find Conversation (THE FIX IS HERE) ---
        // We removed .single() and added sorting to pick the most recent one if duplicates exist
        const { data: existingConvs } = await supabase
          .from('conversations')
          .select('id, unread')
          .eq('phone', senderPhone)
          .order('created_at', { ascending: false }) // Pick the latest one
          .limit(1);

        let conversationId = existingConvs?.[0]?.id;
        let currentUnread = existingConvs?.[0]?.unread || 0;

        if (!conversationId) {
          // CREATE NEW CONVERSATION
          console.log('[Webhook] Creating NEW conversation...');
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              phone: senderPhone,
              name: senderName,
              unread: 1,
              last_message: textBody,
              last_message_at: new Date().toISOString(),
              status: 'open',
            })
            .select()
            .single();
          
          if (createError) {
             console.error('[Webhook] Failed to create conversation:', createError);
             return NextResponse.json({ status: 'error' }, { status: 500 });
          }
          conversationId = newConv.id;

        } else {
          // UPDATE EXISTING CONVERSATION
          console.log('[Webhook] Updating EXISTING conversation...');
          
          const newUnread = currentUnread + 1;

          const { error: updateError } = await supabase
            .from('conversations')
            .update({
              last_message: textBody,
              last_message_at: new Date().toISOString(),
              unread: newUnread,
              status: 'open',
            })
            .eq('id', conversationId);

           if (updateError) console.error('[Webhook] Update Error:', updateError);
        }

        // --- 4. Save Message to DB ---
        const { error: msgError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          direction: 'inbound', // Left Side
          content: textBody,
          status: 'delivered',
          whatsapp_id: whatsappMsgId,
          created_at: new Date().toISOString(),
        });

        if (msgError) console.error('[Webhook] Msg Insert Error:', msgError);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook] Crash Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}