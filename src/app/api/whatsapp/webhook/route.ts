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

    // 1. Check if it's a message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        // --- 2. Extract Data ---
        // Meta sends number strictly as digits (e.g. 919988776655)
        const rawPhone = message.from; 
        
        // Prepare variations to search for
        const phoneWithPlus = `+${rawPhone}`;
        const phoneWithoutPlus = rawPhone;
        
        const textBody = message.text?.body || message.button?.text || '[Media/Other]';
        const senderName = value.contacts?.[0]?.profile?.name || phoneWithPlus;
        const whatsappMsgId = message.id;

        console.log(`[Webhook] Processing message from ${rawPhone}. Searching DB...`);

        // --- 3. Find Conversation (FUZZY SEARCH FIX) ---
        // We search for EITHER "+91..." OR "91..." to be 100% sure we match.
        const { data: existingConvs, error: findError } = await supabase
          .from('conversations')
          .select('id, unread')
          .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithoutPlus}`) 
          .order('created_at', { ascending: false })
          .limit(1);

        if (findError) {
            console.error('[Webhook] DB Search Error:', findError);
        }

        let conversationId = existingConvs?.[0]?.id;
        let currentUnread = existingConvs?.[0]?.unread || 0;

        if (!conversationId) {
          // CREATE NEW CONVERSATION
          console.log('[Webhook] No conversation found. Creating NEW one for:', phoneWithPlus);
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              phone: phoneWithPlus, // Always save WITH plus for consistency
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
          console.log(`[Webhook] Found existing conversation ID: ${conversationId}`);
          
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