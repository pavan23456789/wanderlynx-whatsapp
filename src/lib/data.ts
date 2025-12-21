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
    id?: number | string;
    sender: 'me' | 'other';
    text: string;
    time: string;
};

export type Conversation = {
    id: string; // Corresponds to contact id
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    messages: Message[];
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

const initialConversations: Conversation[] = [
    { id: '1', name: 'Olivia Martin', avatar: 'https://picsum.photos/seed/1/40/40', lastMessage: 'Can you confirm my trip details?', time: '5m', unread: 2, messages: [
        { id: 1, sender: 'other', text: 'Hey, I have a question about my upcoming trip to Paris.', time: '10:30 AM' },
        { id: 2, sender: 'me', text: 'Hello Olivia! I can certainly help with that. What is your question?', time: '10:31 AM' },
        { id: 3, sender: 'other', text: 'Can you confirm my trip details?', time: '10:32 AM' },
    ]},
    { id: '2', name: 'Jackson Lee', avatar: 'https://picsum.photos/seed/2/40/40', lastMessage: 'Thanks for the update!', time: '10m', unread: 0, messages: [
        { id: 4, sender: 'me', text: 'Hi Jackson, just a reminder about your flight check-in tomorrow.', time: '9:00 AM' },
        { id: 5, sender: 'other', text: 'Thanks for the update!', time: '9:05 AM' },
    ]},
    { id: '3', name: 'Isabella Nguyen', avatar: 'https://picsum.photos/seed/3/40/40', lastMessage: 'My flight was rescheduled.', time: '1h', unread: 0, messages: [{ id: 6, sender: 'other', text: 'My flight was rescheduled.', time: '8:00 AM' }] },
    { id: '4', name: 'William Kim', avatar: 'https://picsum.photos/seed/4/40/40', lastMessage: 'Perfect!', time: '2h', unread: 0, messages: [{ id: 7, sender: 'me', text: 'Your new itinerary is attached.', time: '6:30 AM' }, { id: 8, sender: 'other', text: 'Perfect!', time: '6:35 AM' }] },
    { id: '5', name: 'Sophia Gonzalez', avatar: 'https://picsum.photos/seed/5/40/40', lastMessage: 'I have a question about my booking.', time: '1d', unread: 0, messages: [{ id: 9, sender: 'other', text: 'I have a question about my booking.', time: 'Yesterday' }] },
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

// CONVERSATIONS
export const getConversations = (): Conversation[] => getFromStorage('conversations', initialConversations);
export const saveConversations = (conversations: Conversation[]) => saveToStorage('conversations', conversations);

export const addMessageToConversation = (contactId: string, message: Message): Conversation[] => {
    const conversations = getConversations();
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageWithTime = { ...message, time, id: Date.now() };

    const updatedConversations = conversations.map(convo => {
        if (convo.id === contactId) {
            return {
                ...convo,
                messages: [...convo.messages, messageWithTime],
                lastMessage: message.text,
                time: 'Just now',
                unread: message.sender === 'other' ? (convo.unread || 0) + 1 : 0,
            };
        }
        return convo;
    });

    // Bring the updated conversation to the top
    const updatedConvo = updatedConversations.find(c => c.id === contactId);
    const otherConvos = updatedConversations.filter(c => c.id !== contactId);
    const finalConvos = updatedConvo ? [updatedConvo, ...otherConvos] : otherConvos;

    saveConversations(finalConvos);
    return finalConvos;
};

// TEMPLATES
export const getTemplates = (): Template[] => getFromStorage('templates', initialTemplates);
export const saveTemplates = (templates: Template[]) => saveToStorage('templates', templates);


// CAMPAIGNS
export const getCampaigns = (): Campaign[] => getFromStorage('campaigns', initialCampaigns);
export const saveCampaigns = (campaigns: Campaign[]) => saveToStorage('campaigns', campaigns);
