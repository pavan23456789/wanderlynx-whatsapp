import { NextResponse } from 'next/server';
import { 
    getConversations, 
    updateConversationWithMessage, 
    updateMessageStatus 
} from '@/lib/conversation-store';
import { getContactByPhone, addContact } from '@/lib/contact-store';

/**
 * Handles webhook verification for the WhatsApp channel.
 * Meta sends a GET request to this endpoint to verify the webhook.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] Verification successful');
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.warn('[Webhook] Verification failed');
        return new NextResponse('Forbidden', { status: 403 });
    }
}

/**
 * Handles incoming webhook events from WhatsApp.
 * This can include new messages, status updates, etc.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Log the entire incoming payload for debugging
        console.log('[Webhook] Received POST request:', JSON.stringify(body, null, 2));

        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // Handle incoming messages
                    if (value.messages) {
                        for (const message of value.messages) {
                            if (message.type === 'text') {
                                await processIncomingMessage(value.contacts[0], message);
                            }
                        }
                    }

                    // Handle message status updates
                    if (value.statuses) {
                        for (const status of value.statuses) {
                            await processStatusUpdate(status);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
        console.error('[Webhook] Error processing POST request:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

async function processIncomingMessage(contact: { wa_id: string; profile: { name: string } }, message: any) {
    const from = contact.wa_id; // User's phone number
    const name = contact.profile.name;
    const text = message.text.body;
    const messageId = message.id;
    const timestamp = parseInt(message.timestamp) * 1000; // Convert to milliseconds

    console.log(`[Webhook] Incoming message from ${name} (${from}): "${text}"`);
    
    // Check if contact exists, if not, create one
    let existingContact = await getContactByPhone(from);
    if (!existingContact) {
        console.log(`[Webhook] New contact detected. Creating contact for ${name} (${from}).`);
        await addContact({
            id: from, // Use phone number as ID for simplicity
            phone: from,
            name: name,
            email: '',
            trip: 'Unknown',
            tags: ['new-lead'],
            avatar: `https://picsum.photos/seed/${from}/40/40`,
        });
    }

    await updateConversationWithMessage({
        contactId: from,
        contactName: name,
        message: {
            id: messageId,
            sender: 'other',
            text: text,
            time: new Date(timestamp).toISOString(),
            status: 'read' // Assume read since it's an incoming message processed by our system
        }
    });
}

async function processStatusUpdate(status: any) {
    const messageId = status.id;
    const newStatus = status.status; // e.g., 'sent', 'delivered', 'read'
    const timestamp = parseInt(status.timestamp) * 1000;

    console.log(`[Webhook] Status update for message ${messageId}: ${newStatus}`);

    await updateMessageStatus(messageId, newStatus);
}
