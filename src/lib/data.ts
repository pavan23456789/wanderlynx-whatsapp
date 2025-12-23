// This is a mock data service.
// In a real application, this would be replaced with API calls to a backend.
// The data is stored in localStorage to persist between page refreshes.

export type Contact = {
    id: string;
    name: string;
    phone: string;
    email: string;
    trip: string;
    tags: string[];
    avatar: string;
};

export type Message = {
    id: string; // Now using WhatsApp message ID
    sender: 'me' | 'other';
    text: string;
    time: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
};

export type Conversation = {
    id: string; // Corresponds to contact phone number
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    messages: Message[];
    lastMessageTimestamp: number; // For tracking 24-hour window
};

export type Template = {
    id: string;
    name: string;
    category: 'Marketing' | 'Utility';
    content: string;
    status: 'Approved' | 'Pending' | 'Rejected';
    components?: any[]; // Added for template variable parsing
};

export type CampaignMessage = {
    contactId: string;
    status: 'Sent' | 'Failed' | 'Pending';
    timestamp: string;
    error?: string;
};

export type Campaign = {
    id: string;
    name: string;
    templateName: string;
    templateContent: string;
    variables: Record<string, unknown>;
    status: 'Draft' | 'Sending' | 'Completed' | 'Failed';
    audienceCount: number;
    sent: number;
    failed: number;
    statusMessage: string;
    createdAt: string;
    messages: CampaignMessage[];
};


// NOTE: Most data is now being managed by file-based stores on the backend.
// These localStorage functions are being phased out or used as initial placeholders.

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
        try {
            return JSON.parse(storedValue);
        } catch (e) {
            console.error(`Error parsing ${key} from localStorage`, e);
            return defaultValue;
        }
    } else {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// CONTACTS (Now managed by contact-store.ts on the backend)
export const getContacts = (): Contact[] => {
    console.warn("getContacts is deprecated. Use API endpoint /api/contacts.");
    return [];
};
export const saveContacts = (contacts: Contact[]) => {
    console.warn("saveContacts is deprecated. Use API endpoint /api/contacts.");
};

// TEMPLATES (Now managed by template-store.ts on the backend)
export const getTemplates = (): Template[] => {
    console.warn("getTemplates is deprecated. Use API endpoint /api/templates.");
    return [];
};
export const saveTemplates = (templates: Template[]) => {
    console.warn("saveTemplates is deprecated. Use API endpoint /api/templates.");
};

// CAMPAIGNS (Now managed by campaign-store.ts on the backend)
export const getCampaigns = (): Campaign[] => {
    console.warn("getCampaigns is deprecated. Use API endpoint /api/campaigns.");
    return [];
};
export const saveCampaigns = (campaigns: Campaign[]) => {
     console.warn("saveCampaigns is deprecated. Use API endpoint /api/campaigns.");
};

// CONVERSATIONS (Now managed by conversation-store.ts on the backend)
export const getConversations = (): Conversation[] => {
     console.warn("getConversations is deprecated. Use API endpoint /api/conversations.");
    return [];
};
export const saveConversations = (conversations: Conversation[]) => {
     console.warn("saveConversations is deprecated. Use API endpoint /api/conversations.");
};
export const addMessageToConversation = (contactId: string, message: Message): Conversation[] => {
    console.warn("addMessageToConversation is deprecated. Use API endpoint /api/conversations/reply.");
    return [];
};
