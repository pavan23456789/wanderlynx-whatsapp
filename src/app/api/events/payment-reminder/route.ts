import { NextResponse } from 'next/server';
import type { PaymentReminderPayload } from '@/lib/types';
import { getContacts } from '@/lib/data';

/**
 * API route handler for the 'payment-reminder' event.
 * This endpoint is intended to be called by the Travonex backend.
 */
export async function POST(request: Request) {
  try {
    const body: PaymentReminderPayload = await request.json();
    const { contact, payment } = body;

    // --- 1. Log Event Received ---
    console.log('[Wanderlynx] Received: payment-reminder event');
    console.log('[Wanderlynx] Payload:', JSON.stringify(body, null, 2));

    if (!contact?.phone || !payment?.amount || !payment?.dueDate) {
      return NextResponse.json(
        { message: 'Validation Error: Missing required fields (contact.phone, payment.amount, payment.dueDate)' },
        { status: 400 }
      );
    }

    // --- 2. Identify Contact ---
    // In a real system, you'd query a database. Here we check our mock data.
    const contacts = getContacts();
    const existingContact = contacts.find(c => c.phone === contact.phone);

    if (!existingContact) {
      console.log(`[Wanderlynx] Contact not found for phone: ${contact.phone}. Skipping.`);
      return NextResponse.json(
        { success: false, message: `Contact with phone ${contact.phone} not found.` },
        { status: 404 }
      );
    }
    
    console.log(`[Wanderlynx] Identified existing contact: ${existingContact.name} (${existingContact.phone})`);


    // --- 3. Simulate Sending WhatsApp Message ---
    // This is where you would call the WhatsApp Cloud API.
    const templateName = 'payment_reminder';
    const message = `Hi ${existingContact.name}, this is a reminder that your payment of $${payment.amount} is due on ${payment.dueDate}.`;
    
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
