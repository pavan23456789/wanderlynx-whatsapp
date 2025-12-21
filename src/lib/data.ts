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
    category: 'Marketing' | 'Transactional' | 'Utility';
    content: string;
    status: 'Approved' | 'Pending' | 'Rejected';
};

export type Campaign = {
    id: string;
    name:string;
    template: string;
    status: 'Sent' | 'Delivering' | 'Scheduled' | 'Failed';
    sent: number;
    delivered: number;
read: number;
    date: string;
};

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

// --- Initial Data (only used if localStorage is empty) ---
const initialContacts: Contact[] = [
    { id: "1", name: "Olivia Martin", avatar: "https://picsum.photos/seed/1/40/40", phone: "+11234567890", email: "olivia.martin@email.com", trip: "Paris 2024", tags: ["new"] },
    { id: "2", name: "Jackson Lee", avatar: "https://picsum.photos/seed/2/40/40", phone: "+12345678901", email: "jackson.lee@email.com", trip: "Tokyo 2025", tags: ["follow-up"] },
    { id: "3", name: "Isabella Nguyen", avatar: "https://picsum.photos/seed/3/40/40", phone: "+13456789012", email: "isabella.nguyen@email.com", trip: "Rome 2024", tags: [] },
    { id: "4", name: "William Kim", avatar: "https://picsum.photos/seed/4/40/40", phone: "+14567890123", email: "will@email.com", trip: "Sydney 2025", tags: ["vip"] },
    { id: "5", name: "Sophia Gonzalez", avatar: "https://picsum.photos/seed/5/40/40", phone: "+15678901234", email: "sophia.gonzalez@email.com", trip: "London 2024", tags: ["new"] },
];

const initialTemplates: Template[] = [
    { id: "TPL001", name: "welcome_message", category: "Marketing", content: "Hello {{1}}! Welcome to Wanderlynx. How can we help you plan your next adventure?", status: "Approved" },
    { id: "TPL002", name: "trip_confirmation", category: "Transactional", content: "Your trip to {{1}} is confirmed! Your booking ID is {{2}}.", status: "Approved" },
    { id: "TPL003", name: "flight_reminder", category: "Transactional", content: "Reminder: Your flight {{1}} to {{2}} departs in 24 hours.", status: "Pending" },
    { id: "TPL004", name: "summer_promo", category: "Marketing", content: "Don't miss out on our summer sale! Get up to 20% off on select packages.", status: "Approved" },
    { id: "TPL005", name: "new_year_promo", category: "Marketing", content: "Don't miss out on our new year sale! Get up to 30% off on all packages.", status: "Rejected" },

];

const initialCampaigns: Campaign[] = [
    { id: "CAMP001", name: "New Year Promo", template: "new_year_promo", status: "Sent", sent: 1000, delivered: 950, read: 800, date: "2023-12-28" },
    { id: "CAMP002", name: "Summer Sale Kickoff", template: "summer_promo", status: "Delivering", sent: 500, delivered: 250, read: 100, date: "2024-06-15" },
    { id: "CAMP003", name: "Paris Trip Reminders", template: "trip_confirmation", status: "Scheduled", sent: 0, delivered: 0, read: 0, date: "2024-07-01" },
    { id: "CAMP004", name: "Customer Feedback Request", template: "feedback_request", status: "Failed", sent: 200, delivered: 0, read: 0, date: "2024-05-20" },
];

// --- Data Management Functions ---

// CONTACTS
export const getContacts = (): Contact[] => getFromStorage('contacts', initialContacts);
export const saveContacts = (contacts: Contact[]) => saveToStorage('contacts', contacts);


// TEMPLATES
export const getTemplates = (): Template[] => getFromStorage('templates', initialTemplates);
export const saveTemplates = (templates: Template[]) => saveToStorage('templates', templates);


// CAMPAIGNS
export const getCampaigns = (): Campaign[] => getFromStorage('campaigns', initialCampaigns);
export const saveCampaigns = (campaigns: Campaign[]) => saveToStorage('campaigns', campaigns);

// NOTE: Conversation logic is now handled by the backend API and file persistence.
// These localStorage functions are no longer the source of truth for the inbox.
export const getConversations = (): Conversation[] => getFromStorage('conversations', []);
export const saveConversations = (conversations: Conversation[]) => saveToStorage('conversations', conversations);
export const addMessageToConversation = (contactId: string, message: Message): Conversation[] => {
    console.warn("addMessageToConversation is a mock function and should not be used in production for sending messages.");
    return [];
};
