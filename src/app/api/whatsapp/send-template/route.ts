import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

/**
 * This API sends a WhatsApp template message
 * It expects:
 * - phone (string)
 * - template_name (string)
 * - variables (array of strings)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { phone, template_name, variables } = body;

    // 1️⃣ Basic validation (kid-level safety checks)
    if (!phone || !template_name) {
      return NextResponse.json(
        { message: 'phone and template_name are required' },
        { status: 400 }
      );
    }

    // 2️⃣ Get template from Supabase
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('name', template_name)
      .eq('status', 'APPROVED')
      .single();

    if (error || !template) {
      return NextResponse.json(
        { message: 'Template not found or not approved' },
        { status: 404 }
      );
    }

    // 3️⃣ Build WhatsApp template payload
    const components = template.components.map((component: any) => {
      if (component.type === 'BODY' && variables?.length) {
        return {
          type: 'body',
          parameters: variables.map((value: string) => ({
            type: 'text',
            text: value,
          })),
        };
      }
      return null;
    }).filter(Boolean);

    // 4️⃣ Send message to Meta WhatsApp API
    const response = await fetch(
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

    const result = await response.json();

    // 5️⃣ Save outgoing message in DB (optional but important)
    await supabase.from('messages').insert({
      direction: 'outbound',
      body: `Template sent: ${template.name}`,
    });

    return NextResponse.json({
      success: true,
      meta_response: result,
    });

  } catch (err) {
    console.error('[send-template API error]', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
