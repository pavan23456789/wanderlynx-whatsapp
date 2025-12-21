import { NextResponse } from 'next/server';
import type { BookingConfirmedPayload } from '@/lib/types';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

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
    
    // --- 2. Log Event Details ---
    console.log('[Wanderlynx] Received: booking_confirmed event');
    console.log(`[Wanderlynx]   - Contact: ${contact.name} (${contact.phone})`);
    
    // --- 3. Send WhatsApp Message ---
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    
    // Define the template and its parameters
    // IMPORTANT: The template name 'booking_confirmation_v1' must exist and be approved in your WhatsApp Business Manager.
    // The number of parameters must match the template.
    const templateName = 'booking_confirmation_v1';
    const templateParams = [contact.name, trip.name, trip.bookingId];
    
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
      message: 'Event "booking_confirmed" processed successfully.',
    });
  } catch (error) {
    console.error('[Wanderlynx] Error processing "booking_confirmed" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
