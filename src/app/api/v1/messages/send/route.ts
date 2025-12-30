import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID; // Must be 935339339662475

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = req.headers.get('x-api-key');

    // 1. Verify Partner API Key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('business_id')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Build Meta Payload
    const metaPayload = {
      messaging_product: "whatsapp",
      to: body.to,
      type: "template",
      template: {
        name: body.templateName,
        language: { code: body.language || 'en_US' },
        components: [
          {
            type: "body",
            parameters: body.variables.map((val: string) => ({
              type: "text",
              text: val
            }))
          }
        ]
      }
    };

    // 3. Send via Phone ID Endpoint
    // ERROR FIX: We use PHONE_ID here, not Business ID
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "Meta API Error");

    return NextResponse.json({ success: true, meta_id: result.messages?.[0]?.id });

  } catch (error: any) {
    console.error("[API Error]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}