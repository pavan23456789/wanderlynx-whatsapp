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
        // Meta sends number WITHOUT + (e.g., 919988776655)
        const rawPhone = message.from; 
        const senderPhone = `+${rawPhone}`; 
        
        const textBody = message.text?.body || message.button?.text || '[Media/Other]';
        const senderName = value.contacts?.[0]?.profile?.name || senderPhone;
        const whatsappMsgId = message.id;

        console.log(`[Webhook] Received from ${senderPhone}: ${textBody}`);

        // --- 3. Find or Create Conversation ---
        let { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('phone', senderPhone)
          .single();

        let conversationId = conversation?.id;

        if (!conversationId) {
          console.log('[Webhook] New Contact! Creating conversation...');
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
          // ✅ FIXED: Correctly handle RPC errors without .catch()
          const { error: rpcError } = await supabase.rpc('increment_unread', { row_id: conversationId });
          
          if (rpcError) {
             // Fallback: If RPC fails, just set unread to 1 manually
             console.warn('[Webhook] RPC failed, using fallback:', rpcError.message);
             await supabase.from('conversations').update({ unread: 1 }).eq('id', conversationId);
          }

          // Update last message timestamp
          await supabase
            .from('conversations')
            .update({
              last_message: textBody,
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
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
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}