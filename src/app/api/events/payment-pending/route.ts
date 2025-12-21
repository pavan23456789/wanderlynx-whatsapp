import { NextResponse } from 'next/server';
import type { PaymentPendingPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';
import { hasProcessedInvoiceId, logMessageEvent } from '@/lib/logger';

/**
 * API route handler for the 'payment_pending' event.
 * This endpoint strictly follows the V1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  let idempotencyKey: string | undefined;

  try {
    const body: PaymentPendingPayload = await request.json();
    const { contact, payment } = body;
    idempotencyKey = payment.invoiceId;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !payment?.amount || !payment?.currency || !payment?.dueDate) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    // --- 2. Log Event Reception ---
    console.log(`[Wanderlynx] Received: payment_pending event for invoiceId: ${idempotencyKey || 'N/A'}`);
    
    // --- 3. Idempotency Check ---
    if (idempotencyKey && await hasProcessedInvoiceId(idempotencyKey)) {
        await logMessageEvent({
            idempotencyKey,
            type: 'invoice',
            status: 'SKIPPED',
            event: 'payment_pending',
            recipient: contact.phone,
            details: { message: `Duplicate event for invoiceId ${idempotencyKey}. Skipping.` },
        });
        console.log(`[Wanderlynx] Idempotency check: Duplicate event for invoiceId ${idempotencyKey}. Skipping.`);
        return NextResponse.json({
            success: true,
            message: `Duplicate event for invoiceId ${idempotencyKey}. Already processed.`,
        });
    }
    
    // --- 4. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    const templateName = 'payment_pending_v1';
    const templateParams = [
        `${payment.amount} ${payment.currency}`,
        payment.dueDate
    ];

    try {
        await sendWhatsAppTemplateMessage(contact.phone, templateName, templateParams);
        
        // Log only on success and if a key exists
        if (idempotencyKey) {
          await logMessageEvent({
            idempotencyKey,
            type: 'invoice',
            status: 'SUCCESS',
            event: 'payment_pending',
            recipient: contact.phone,
            details: { template: templateName, params: templateParams },
          });
        }
        console.log(`[Wanderlynx]   - SUCCESS: WhatsApp API invoked for invoiceId: ${idempotencyKey || 'N/A'}`);
        
    } catch (apiError: any) {
        if (idempotencyKey) {
            await logMessageEvent({
                idempotencyKey,
                type: 'invoice',
                status: 'FAILURE',
                event: 'payment_pending',
                recipient: contact.phone,
                details: { template: templateName },
                error: apiError.message,
            });
        }
        console.error(`[Wanderlynx]   - FAILURE: Could not send WhatsApp message for invoiceId: ${idempotencyKey || 'N/A'}. Reason: ${apiError.message}`);
        // Do not re-throw. Acknowledge the event was received, but log the failure.
    }


    return NextResponse.json({
      success: true,
      message: 'Event "payment_pending" processed.',
    });
  } catch (error: any) {
    console.error('[Wanderlynx] CRITICAL: Error processing "payment_pending" event:', error);
     if (idempotencyKey) {
        await logMessageEvent({
            idempotencyKey,
            type: 'invoice',
            status: 'FAILURE',
            event: 'payment_pending',
            recipient: 'N/A',
            details: { message: "Critical error during processing." },
            error: error.message,
        });
    }
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
