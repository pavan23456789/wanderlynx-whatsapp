import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define the shape of the incoming request
interface SendMessageRequest {
  phone: string;
  template_name: string;
  variables?: string[];
}

export async function POST(request: Request) {
  try {
    // 1. Check for API Keys
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp Environment Variables');
      return NextResponse.json(
        { message: 'Server configuration error: Missing Env Vars' },
        { status: 500 }
      );
    }

    // 2. Initialize Supabase
    const supabase = await createClient();

    // 3. Parse the Request Body
    const body: SendMessageRequest = await request.json();
    const { phone, template_name, variables } = body;

    if (!phone || !template_name) {
      return NextResponse.json(
        { message: 'Phone and template_name are required' },
        { status: 400 }
      );
    }

    console.log(`[API] Attempting to send template: ${template_name} to ${phone}`);

    // 4. Validate Template against Database
    // (This is where your 404 error was coming from!)
    const { data: template, error: dbError } = await supabase
      .from('templates')
      .select('*')
      .eq('name', template_name)
      .eq('status', 'APPROVED')
      .single();

    if (dbError || !template) {
      console.error('[API] Template lookup failed:', dbError);
      return NextResponse.json(
        { message: `Template '${template_name}' not found or not approved in DB` },
        { status: 404 }
      );
    }

    // 5. Build the Payload for Meta
    const components = template.components
      ? template.components
          .map((component: any) => {
            if (component.type === 'BODY' && variables && variables.length > 0) {
              return {
                type: 'body',
                parameters: variables.map((value: string) => ({
                  type: 'text',
                  text: value,
                })),
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    // 6. Send to Meta API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: template.name,
            language: { code: template.language },
            components,
          },
        }),
      }
    );

    const metaResult = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('[Meta API Error]', metaResult);
      return NextResponse.json(
        { message: 'Meta API rejected the request', details: metaResult },
        { status: metaResponse.status }
      );
    }

    // 7. Log Success to DB (Optional but recommended)
    await supabase.from('messages').insert({
      direction: 'outbound',
      body: `Template sent: ${template.name}`,
      meta_response: metaResult,
    });

    return NextResponse.json({ success: true, meta_response: metaResult });

  } catch (err: any) {
    console.error('[Fatal Error]', err);
    return NextResponse.json(
      { message: 'Internal Server Error', error: err.message },
      { status: 500 }
    );
  }
}