import { NextResponse } from 'next/server';
import { getConversations } from '@/lib/conversation-store';

export async function GET(request: Request) {
    try {
        const conversations = await getConversations();
        // Sort by most recent message
        const sortedConversations = conversations.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        return NextResponse.json(sortedConversations);
    } catch (error: any) {
        console.error('[API/Conversations] Failed to get conversations:', error);
        return NextResponse.json({ message: 'Failed to retrieve conversations' }, { status: 500 });
    }
}
