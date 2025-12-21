import { NextResponse } from 'next/server';
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from '@/lib/whatsapp';
import { getConversationById, updateConversationWithMessage } from '@/lib/conversation-store';
import { isAfter, subHours } from 'date-fns';

export async function POST(request: Request) {
    try {
        const { contactId, text, isTemplate, templateParams } = await request.json();

        if (!contactId || !text) {
            return NextResponse.json({ message: 'Missing contactId or text' }, { status: 400 });
        }

        const conversation = await getConversationById(contactId);
        if (!conversation) {
            return NextResponse.json({ message: 'Conversation not found' }, { status: 404 });
        }
        
        // Enforce 24-hour window rule for non-template messages
        if (!isTemplate) {
            const twentyFourHoursAgo = subHours(new Date(), 24);
            const lastMessageDate = new Date(conversation.lastMessageTimestamp);
            if (isAfter(twentyFourHoursAgo, lastMessageDate)) {
                 return NextResponse.json({ message: 'The 24-hour messaging window has closed. You must use a template.' }, { status: 403 });
            }
        }
        
        let messageId;
        if (isTemplate) {
            const response = await sendWhatsAppTemplateMessage(contactId, text, templateParams || []);
            // For templates, the API response doesn't directly give a message ID in the same way.
            // We'll use a placeholder or need to handle this based on the actual API response structure for templates.
            messageId = response.messages[0]?.id || `tpl-${Date.now()}`;
        } else {
            messageId = await sendWhatsAppTextMessage(contactId, text);
        }

        const updatedConversation = await updateConversationWithMessage({
            contactId: contactId,
            contactName: conversation.name,
            message: {
                id: messageId,
                sender: 'me',
                text: isTemplate ? `TEMPLATE: ${text}` : text,
                time: new Date().toISOString(),
                status: 'sent', // Initial status
            }
        });

        return NextResponse.json(updatedConversation);

    } catch (error: any) {
        console.error('[API/Reply] Failed to send message:', error);
        return NextResponse.json({ message: error.message || 'Failed to send reply' }, { status: 500 });
    }
}
