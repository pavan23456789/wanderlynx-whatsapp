import { NextResponse } from 'next/server';
import type { BookingConfirmedPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';
import { hasProcessedBookingId, logMessageEvent } from '@/lib/logger';

/**
 * API route handler for the 'booking_confirmed' event.
 * This endpoint strictly follows the V1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  let bookingId: string | undefined;

  try {
    const body: BookingConfirmedPayload = await request.json();
    const { contact, trip } = body;
    bookingId = trip?.bookingId;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !contact?.name || !bookingId || !trip.name || !trip.destination || !trip.startDate) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    // --- 2. Log Event Reception ---
    console.log(`[Wanderlynx] Received: booking_confirmed event for bookingId: ${bookingId}`);
    
    // --- 3. Idempotency Check ---
    if (await hasProcessedBookingId(bookingId)) {
        await logMessageEvent({
            idempotencyKey: bookingId,
            type: 'booking',
            status: 'SKIPPED',
            event: 'booking_confirmed',
            recipient: contact.phone,
            details: { message: `Duplicate event for bookingId ${bookingId}. Skipping.` },
        });
        console.log(`[Wanderlynx] Idempotency check: Duplicate event for bookingId ${bookingId}. Skipping.`);
        return NextResponse.json({
            success: true,
            message: `Duplicate event for bookingId ${bookingId}. Already processed.`,
        });
    }
    
    // --- 4. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    const templateName = 'booking_confirmation_v1';
    const templateParams = [contact.name, trip.name, trip.bookingId];
    
    try {
        await sendWhatsAppTemplateMessage(contact.phone, templateName, templateParams);
        
        await logMessageEvent({
            idempotencyKey: bookingId,
            type: 'booking',
            status: 'SUCCESS',
            event: 'booking_confirmed',
            recipient: contact.phone,
            details: { template: templateName, params: templateParams },
        });
        console.log(`[Wanderlynx]   - SUCCESS: WhatsApp API invoked for bookingId ${bookingId}`);

    } catch (apiError: any) {
        await logMessageEvent({
            idempotencyKey: bookingId,
            type: 'booking',
            status: 'FAILURE',
            event: 'booking_confirmed',
            recipient: contact.phone,
            details: { template: templateName },
            error: apiError.message,
        });
        console.error(`[Wanderlynx]   - FAILURE: Could not send WhatsApp message for bookingId ${bookingId}. Reason: ${apiError.message}`);
        // Do not re-throw. We acknowledge the event, but log the failure.
    }


    return NextResponse.json({
      success: true,
      message: 'Event "booking_confirmed" processed.',
    });
  } catch (error: any) {
    console.error('[Wanderlynx] CRITICAL: Error processing "booking_confirmed" event:', error);
    if (bookingId) {
        await logMessageEvent({
            idempotencyKey: bookingId,
            type: 'booking',
            status: 'FAILURE',
            event: 'booking_confirmed',
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
