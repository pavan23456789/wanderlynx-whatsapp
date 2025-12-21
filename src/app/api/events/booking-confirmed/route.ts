import { NextResponse } from 'next/server';
import type { BookingConfirmedPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

// Simple in-memory cache for idempotency. In a production environment,
// this should be replaced with a persistent store like Redis or a database.
const processedBookingIds = new Set<string>();

/**
 * API route handler for the 'booking_confirmed' event.
 * This endpoint strictly follows the V1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  try {
    const body: BookingConfirmedPayload = await request.json();
    const { contact, trip } = body;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !contact?.name || !trip?.bookingId || !trip.name || !trip.destination || !trip.startDate) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    const { bookingId } = trip;

    // --- 2. Log Event Details ---
    console.log(`[Wanderlynx] Received: booking_confirmed event for bookingId: ${bookingId}`);
    
    // --- 3. Idempotency Check ---
    if (processedBookingIds.has(bookingId)) {
        console.log(`[Wanderlynx] Idempotency check: Duplicate event for bookingId ${bookingId}. Skipping.`);
        return NextResponse.json({
            success: true,
            message: `Duplicate event for bookingId ${bookingId}. Already processed.`,
        });
    }
    
    // --- 4. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    // Define the template and its parameters
    // IMPORTANT: The template name 'booking_confirmation_v1' must exist and be approved in your WhatsApp Business Manager.
    const templateName = 'booking_confirmation_v1';
    const templateParams = [contact.name, trip.name, trip.bookingId];
    
    try {
        await sendWhatsAppTemplateMessage(contact.phone, templateName, templateParams);
        console.log(`[Wanderlynx]   - SUCCESS: WhatsApp API invoked for bookingId ${bookingId}`);
        // Add to cache only on successful API invocation
        processedBookingIds.add(bookingId);
    } catch (apiError: any) {
        console.error(`[Wanderlynx]   - FAILURE: Could not send WhatsApp message for bookingId ${bookingId}. Reason: ${apiError.message}`);
        // Do not re-throw. We acknowledge the event was received, but log the failure.
        // A production system might add this to a retry queue.
    }


    return NextResponse.json({
      success: true,
      message: 'Event "booking_confirmed" processed.',
    });
  } catch (error) {
    console.error('[Wanderlynx] CRITICAL: Error processing "booking_confirmed" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
