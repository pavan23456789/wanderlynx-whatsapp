import type { WhatsAppMessagePayload } from './types';

/**
 * Sends a WhatsApp template message using the Meta Cloud API.
 * This function now includes robust error handling.
 * @param to The recipient's phone number in E.164 format.
 * @param templateName The name of the message template.
 * @param templateParams The parameters to substitute into the template.
 * @returns The response from the WhatsApp API.
 * @throws An error if the API request fails, containing the reason.
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

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || `HTTP status ${response.status}`;
    // Throw a detailed error to be caught by the calling API route
    throw new Error(`WhatsApp API request failed: ${errorMessage}`);
  }

  const responseData = await response.json();
  return responseData;
}


/**
 * Sends a free-text WhatsApp message.
 * @param to The recipient's phone number.
 * @param text The text message to send.
 * @returns The message ID from the WhatsApp API response.
 */
export async function sendWhatsAppTextMessage(to: string, text: string) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error('WhatsApp environment variables are not configured.');
  }

  const apiUrl = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: {
      body: text,
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || `HTTP status ${response.status}`;
    throw new Error(`WhatsApp API request failed: ${errorMessage}`);
  }

  const responseData = await response.json();
  // The response for a successful text message contains a 'messages' array with one object
  const messageId = responseData.messages?.[0]?.id;
  if (!messageId) {
      throw new Error('Could not get message ID from WhatsApp API response.');
  }
  return messageId;
}
