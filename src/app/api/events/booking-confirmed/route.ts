import { NextResponse } from 'next/server';
import type { BookingConfirmedPayload } from '@/lib/types';
import { getContacts, saveContacts } from '@/lib/data';

/**
 * API route handler for the 'booking-confirmed' event.
 * This endpoint is intended to be called by the Travonex backend.
 */
export async function POST(request: Request) {
  try {
    const body: BookingConfirmedPayload = await request.json();
    const { contact, trip } = body;

    // --- 1. Log Event Received ---
    console.log('[Wanderlynx] Received: booking-confirmed event');
    console.log('[Wanderlynx] Payload:', JSON.stringify(body, null, 2));

    if (!contact?.phone || !contact?.name || !trip?.bookingId) {
      return NextResponse.json(
        { message: 'Validation Error: Missing required fields (contact.phone, contact.name, trip.bookingId)' },
        { status: 400 }
      );
    }
    
    // --- 2. Identify/Create Contact ---
    // In a real system, you'd use a database. Here we use our mock data store.
    let contacts = getContacts();
    let existingContact = contacts.find(c => c.phone === contact.phone);

    if (existingContact) {
      console.log(`[Wanderlynx] Identified existing contact: ${existingContact.name} (${existingContact.phone})`);
      // Update contact with latest trip info
      existingContact.trip = trip.name;
    } else {
      console.log(`[Wanderlynx] No existing contact found. Creating new contact for: ${contact.name} (${contact.phone})`);
      const newContact = {
        id: `contact-${Date.now()}`,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        trip: trip.name,
        tags: ['new'],
        avatar: `https://picsum.photos/seed/${Date.now()}/40/40`,
      };
      contacts.unshift(newContact);
    }
    saveContacts(contacts);


    // --- 3. Simulate Sending WhatsApp Message ---
    // This is where you would call the WhatsApp Cloud API.
    const templateName = 'trip_confirmation';
    const message = `Your trip to ${trip.destination} is confirmed! Your booking ID is ${trip.bookingId}.`;
    
    console.log(`[Wanderlynx] SIMULATING WHATSAPP SEND to ${contact.phone}`);
    console.log(`[Wanderlynx]   - Template: ${templateName}`);
    console.log(`[Wanderlynx]   - Message: "${message}"`);
    

    return NextResponse.json({
      success: true,
      message: 'Event processed and message sending simulated.',
    });
  } catch (error) {
    console.error('[Wanderlynx] Error processing event:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
