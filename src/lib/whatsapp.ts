import type { WhatsAppMessagePayload } from './types';

/**
 * Sends a WhatsApp template message using the Meta Cloud API.
 * @param to The recipient's phone number in E.164 format.
 * @param templateName The name of the message template.
 * @param templateParams The parameters to substitute into the template.
 * @returns The response from the WhatsApp API.
 */
export async function sendWhatsAppTemplateMessage(
  to: string,
  templateName: string,
  templateParams: string[]
) {
  const { 
    WHATSAPP_ACCESS_TOKEN, 
    WHATSAPP_PHONE_NUMBER_ID
  } = process.env;

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp environment variables are not configured.');
  }

  const apiUrl = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload: WhatsAppMessagePayload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          parameters: templateParams.map(param => ({ type: 'text', text: param })),
        },
      ],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[Wanderlynx] WhatsApp API Error:', responseData);
      throw new Error(`WhatsApp API request failed with status ${response.status}`);
    }

    console.log('[Wanderlynx] WhatsApp message sent successfully:', responseData);
    return responseData;

  } catch (error) {
    console.error('[Wanderlynx] Error sending WhatsApp message:', error);
    throw error;
  }
}
