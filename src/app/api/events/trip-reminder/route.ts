import { NextResponse } from 'next/server';
import type { TripReminderPayload } from '@/lib/types';

/**
 * API route handler for the 'trip_reminder' event.
 * This endpoint strictly follows the V1.1 EVENT_CONTRACT.md.
 */
export async function POST(request: Request) {
  try {
    const body: TripReminderPayload = await request.json();
    const { contact, trip } = body;

    // --- 1. Validate Payload ---
    if (!contact?.phone || !trip?.name || !trip?.startDate || !trip.destination) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: Missing required fields.' },
        { status: 400 }
      );
    }
    
    // --- 2. Log Event Details ---
    console.log('[Wanderlynx] Received: trip_reminder event');
    console.log(`[Wanderlynx]   - Contact: ${contact.phone}`);
    
    // --- 3. Log Message Intent ---
    const message = `Update: Friendly reminder that your trip "${trip.name}" to ${trip.destination} begins on ${trip.startDate}.`;
    console.log(`[Wanderlynx]   - Intent: Send WhatsApp message to ${contact.phone}`);
    console.log(`[Wanderlynx]   - Message: "${message}"`);


    return NextResponse.json({
      success: true,
      message: 'Event "trip_reminder" processed successfully.',
    });
  } catch (error) {
    console.error('[Wanderlynx] Error processing "trip_reminder" event:', error);
    return NextResponse.json(
      { success: false, message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
