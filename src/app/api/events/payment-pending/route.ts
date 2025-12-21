import { NextResponse } from 'next/server';
import type { PaymentPendingPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

/**
 * API route handler for the 'payment_pending' event.
 * This endpoint strictly follows the V1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  try {
    const body: PaymentPendingPayload = await request.json();
    const { contact, payment } = body;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !payment?.amount || !payment?.currency || !payment?.dueDate) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    // --- 2. Log Event Details ---
    console.log('[Wanderlynx] Received: payment_pending event');
    console.log(`[Wanderlynx]   - Contact: ${contact.phone}`);
    
    // --- 3. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    // Define the template and its parameters
    // IMPORTANT: The template name 'payment_pending_v1' must exist and be approved in your WhatsApp Business Manager.
    const templateName = 'payment_pending_v1';
    // The parameters should correspond to variables like {{1}}, {{2}}, etc. in your template.
    // e.g., "Reminder: A payment of {{1}} is due on {{2}}."
    const templateParams = [
        `${payment.amount} ${payment.currency}`, // e.g., "750.00 USD"
        payment.dueDate // e.g., "2024-09-01"
    ];

    try {
        await sendWhatsAppTemplateMessage(contact.phone, templateName, templateParams);
        console.log(`[Wanderlynx]   - Successfully invoked WhatsApp API for contact ${contact.phone}`);
    } catch (apiError) {
        console.error(`[Wanderlynx]   - Failed to send WhatsApp message for contact ${contact.phone}.`);
        // We still return a success to the caller (Travonex) as the event was received,
        // but log the internal error. A real implementation might add this to a retry queue.
    }


    return NextResponse.json({
      success: true,
      message: 'Event "payment_pending" processed successfully.',
    });
  } catch (error) {
    console.error('[Wanderlynx] Error processing "payment_pending" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
