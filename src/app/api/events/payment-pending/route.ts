import { NextResponse } from 'next/server';
import type { PaymentPendingPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

// Simple in-memory cache for idempotency. In a production environment,
// this should be replaced with a persistent store like Redis or a database.
// We use invoiceId as the idempotency key.
const processedInvoiceIds = new Set<string>();

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
    
    const idempotencyKey = payment.invoiceId; // Using optional invoiceId for idempotency

    // --- 2. Log Event Details ---
    console.log(`[Wanderlynx] Received: payment_pending event for invoiceId: ${idempotencyKey || 'N/A'}`);
    
    // --- 3. Idempotency Check ---
    if (idempotencyKey && processedInvoiceIds.has(idempotencyKey)) {
        console.log(`[Wanderlynx] Idempotency check: Duplicate event for invoiceId ${idempotencyKey}. Skipping.`);
        return NextResponse.json({
            success: true,
            message: `Duplicate event for invoiceId ${idempotencyKey}. Already processed.`,
        });
    }
    
    // --- 4. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    // Define the template and its parameters
    const templateName = 'payment_pending_v1';
    const templateParams = [
        `${payment.amount} ${payment.currency}`,
        payment.dueDate
    ];

    try {
        await sendWhatsAppTemplateMessage(contact.phone, templateName, templateParams);
        console.log(`[Wanderlynx]   - SUCCESS: WhatsApp API invoked for invoiceId: ${idempotencyKey || 'N/A'}`);
        // Add to cache only on successful API invocation and if a key exists
        if (idempotencyKey) {
            processedInvoiceIds.add(idempotencyKey);
        }
    } catch (apiError: any) {
        console.error(`[Wanderlynx]   - FAILURE: Could not send WhatsApp message for invoiceId: ${idempotencyKey || 'N/A'}. Reason: ${apiError.message}`);
        // Do not re-throw. Acknowledge the event was received, but log the failure.
    }


    return NextResponse.json({
      success: true,
      message: 'Event "payment_pending" processed.',
    });
  } catch (error) {
    console.error('[Wanderlynx] CRITICAL: Error processing "payment_pending" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
