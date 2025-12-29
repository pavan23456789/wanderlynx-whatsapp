import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // ✅ Correct Variable

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, text, templateName, params } = body;

    console.log('[API] Sending message to:', contactId);

    // 2. Get Recipient Phone
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('phone')
      .eq('id', contactId)
      .single();

    if (fetchError || !conversation) {
      console.error('[API] Conversation Error:', fetchError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 3. Prepare Payload
    let metaPayload: any = {
      messaging_product: 'whatsapp',
      to: conversation.phone,
    };

    if (templateName) {
      metaPayload.type = 'template';
      metaPayload.template = {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: params?.map((p: string) => ({ type: 'text', text: p })) || [],
          },
        ],
      };
    } else {
      metaPayload.type = 'text';
      metaPayload.text = { body: text };
    }

    // 4. Send to Meta (This part is working!)
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      console.error('[API] Meta Error:', metaData);
      return NextResponse.json({ error: metaData.error?.message }, { status: 500 });
    }

    // 5. SAVE TO DB (The Safe Block)
    // We try to save. If it fails, we log the error but still tell the frontend "Success"
    // because the message WAS actually sent to the customer.
    try {
        const contentToSave = templateName ? `Template sent: ${templateName}` : text;
        const whatsappId = metaData.messages?.[0]?.id || null;

        const { error: dbError } = await supabase.from('messages').insert({
          conversation_id: contactId,
          direction: 'outbound',
          content: contentToSave,
          status: 'sent',
          whatsapp_id: whatsappId,
        });

        if (dbError) {
            console.error('[API] DB Insert FAILED:', dbError);
            // DO NOT THROW. Just log it so we know why the UI isn't updating.
        } else {
            // Only update the conversation timestamp if the message saved successfully
            await supabase.from('conversations').update({
                last_message: contentToSave,
                last_message_at: new Date().toISOString(),
            }).eq('id', contactId);
        }

    } catch (dbCrash) {
        console.error('[API] DB Critical Crash:', dbCrash);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API] General Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}