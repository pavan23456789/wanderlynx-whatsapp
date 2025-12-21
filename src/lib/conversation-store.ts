import * as fs from 'fs/promises';
import * as path from 'path';
import type { Conversation, Message } from './data';

const CONVERSATIONS_FILE_PATH = path.join(process.cwd(), 'logs', 'conversations.json');

type ConversationStore = {
    conversations: Conversation[];
};

/**
 * Ensures the log directory and file exist, and returns the conversation data.
 */
async function getStore(): Promise<ConversationStore> {
    try {
        await fs.mkdir(path.dirname(CONVERSATIONS_FILE_PATH), { recursive: true });
        const data = await fs.readFile(CONVERSATIONS_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const defaultStore: ConversationStore = { conversations: [] };
            await fs.writeFile(CONVERSATIONS_FILE_PATH, JSON.stringify(defaultStore, null, 2));
            return defaultStore;
        }
        console.error('[ConvoStore] Failed to read conversation file:', error);
        return { conversations: [] };
    }
}

/**
 * Writes the provided data to the conversation file.
 */
async function writeStore(store: ConversationStore): Promise<void> {
    try {
        await fs.writeFile(CONVERSATIONS_FILE_PATH, JSON.stringify(store, null, 2));
    } catch (error) {
        console.error('[ConvoStore] Failed to write to conversation file:', error);
    }
}

/**
 * Retrieves all conversations.
 */
export async function getConversations(): Promise<Conversation[]> {
    const store = await getStore();
    return store.conversations;
}

/**
 * Retrieves a single conversation by its ID (contact phone number).
 */
export async function getConversationById(id: string): Promise<Conversation | undefined> {
    const conversations = await getConversations();
    return conversations.find(c => c.id === id);
}

/**
 * Updates a conversation with a new message, or creates a new conversation.
 */
export async function updateConversationWithMessage({
    contactId,
    contactName,
    message
}: {
    contactId: string;
    contactName: string;
    message: Message;
}): Promise<Conversation> {
    const store = await getStore();
    const now = Date.now();
    let conversation = store.conversations.find(c => c.id === contactId);

    if (conversation) {
        // Conversation exists, add message and update metadata
        conversation.messages.push(message);
        conversation.lastMessage = message.text;
        conversation.lastMessageTimestamp = now;
        conversation.time = new Date(now).toISOString();
        if (message.sender === 'other') {
            conversation.unread = (conversation.unread || 0) + 1;
        }
    } else {
        // New conversation
        conversation = {
            id: contactId,
            name: contactName,
            avatar: `https://picsum.photos/seed/${contactId}/40/40`, // Generate a consistent avatar
            lastMessage: message.text,
            time: new Date(now).toISOString(),
            unread: message.sender === 'other' ? 1 : 0,
            messages: [message],
            lastMessageTimestamp: now,
        };
        store.conversations.push(conversation);
    }

    await writeStore(store);
    return conversation;
}

/**
 * Updates the status of a specific message within a conversation.
 */
export async function updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') {
    const store = await getStore();
    let found = false;

    for (const conversation of store.conversations) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
            // Do not downgrade status (e.g., from 'read' to 'delivered')
            if (message.status === 'read' && (status === 'delivered' || status === 'sent')) continue;
            if (message.status === 'delivered' && status === 'sent') continue;

            message.status = status;
            found = true;
            break; 
        }
    }

    if (found) {
        await writeStore(store);
    } else {
        console.warn(`[ConvoStore] Could not find message with ID ${messageId} to update status.`);
    }
}
