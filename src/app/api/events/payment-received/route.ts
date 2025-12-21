import { NextResponse } from 'next/server';
import type { PaymentReceivedPayload } from '@/lib/types';

/**
 * API route handler for the 'payment_received' event.
 * This endpoint strictly follows the V1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  try {
    const body: PaymentReceivedPayload = await request.json();
    const { contact, payment } = body;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !payment?.amount || !payment?.currency) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    // --- 2. Log Event Details ---
    console.log('[Wanderlynx] Received: payment_received event');
    console.log(`[Wanderlynx]   - Contact: ${contact.phone}`);
    
    // --- 3. Log Message Intent ---
    const message = `Confirmation: We have received your payment of ${payment.amount} ${payment.currency}. Receipt ID: ${payment.receiptId || 'N/A'}.`;
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    console.log(`[Wanderlynx]   - Message: "${message}"`);


    return NextResponse.json({
      success: true,
      message: 'Event "payment_received" processed successfully.',
    });
  } catch (error) {
    console.error('[Wanderlynx] Error processing "payment_received" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
