import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 1. Define interfaces for type safety
interface SendMessageRequest {
  phone: string;
  template_name: string;
  variables?: string[];
}

export async function POST(request: Request) {
  try {
    // 2. Validate Environment Variables exist before running logic
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.error('Missing WhatsApp Environment Variables');
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 3. Initialize Supabase (AWAIT is required here now)
    const supabase = await createClient();

    const body: SendMessageRequest = await request.json();
    const { phone, template_name, variables } = body;

    // 4. Basic Input Validation
    if (!phone || !template_name) {
      return NextResponse.json(
        { message: 'Phone and template_name are required' },
        { status: 400 }
      );
    }

    // 5. Get template from Supabase
    const { data: template, error: dbError } = await supabase
      .from('templates')
      .select('*')
      .eq('name', template_name)
      .eq('status', 'APPROVED')
      .single();

    if (dbError || !template) {
      return NextResponse.json(
        { message: 'Template not found or not approved' },
        { status: 404 }
      );
    }

    // 6. Build WhatsApp template payload
    const components = template.components
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
      .filter(Boolean);

    // 7. Send message to Meta WhatsApp API
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

    if (!metaResponse.ok || metaResult.error) {
      console.error('Meta API Error:', metaResult);
      return NextResponse.json(
        { message: 'Failed to send message via WhatsApp', details: metaResult },
        { status: metaResponse.status || 400 }
      );
    }

    // 8. Save outgoing message in DB
    const { error: logError } = await supabase.from('messages').insert({
      direction: 'outbound',
      body: `Template sent: ${template.name}`,
      meta_response: metaResult,
    });

    if (logError) {
      console.error('Failed to log message to DB:', logError);
    }

    return NextResponse.json({
      success: true,
      meta_response: metaResult,
    });

  } catch (err) {
    console.error('[send-template API error]', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}