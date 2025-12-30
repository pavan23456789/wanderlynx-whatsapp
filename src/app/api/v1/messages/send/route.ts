import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. Connect to your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID;

export async function POST(req: Request) {
  try {
    // 2. Get the data being sent to us
    const body = await req.json();
    const apiKey = req.headers.get('x-api-key');

    // 3. Security Check: Is the Travonex API Key valid?
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('business_id')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // 4. Format the message for WhatsApp (Meta)
    // We take the variables sent to us and turn them into Meta's required format
    const formattedVariables = body.variables.map((val: string) => ({
      type: 'text',
      text: val
    }));

    const metaPayload = {
      messaging_product: "whatsapp",
      to: body.to,
      type: "template",
      template: {
        name: body.templateName,
        language: { code: body.language || 'en' },
        components: [
          {
            type: "body",
            parameters: formattedVariables
          }
        ]
      }
    };

    // 5. Fire! Send the message to Meta
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_BUSINESS_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      }
    );

    const result = await response.json();

    if (!response.ok) throw new Error(result.error?.message || 'Meta API Error');

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully!',
      meta_id: result.messages?.[0]?.id 
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}