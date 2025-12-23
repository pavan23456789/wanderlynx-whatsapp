// This file provides mock data for the Inbox page UI.
// In a real application, this data would come from a live backend API.

export type Message = {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string; // ISO 8601 string
};

export type Conversation = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTimestamp: number;
  isWindowOpen: boolean; // Determines if the 24hr WhatsApp window is open
  messages: Message[];
  assignedTo?: string | null; // Agent ID from mockAgents.ts
  pinned?: boolean;
  unread?: number;
  lastCustomerMessageAt?: number | null;
  lastAgentMessageAt?: number | null;
};

export type Template = {
  id:string;
  name: string;
  category: 'Marketing' | 'Utility';
  content: string;
  status: 'Approved' | 'Pending' | 'Rejected';
};

const now = new Date().getTime();

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Olivia Martin',
    phone: '+1 415 555 2671',
    avatar: 'https://picsum.photos/seed/1/80/80',
    lastMessage: 'Sure, I can help with that. What is your booking ID?',
    lastMessageTimestamp: now - 2 * 60 * 1000, // 2 minutes ago
    isWindowOpen: true,
    messages: [
      { id: 'msg_1_1', sender: 'them', text: 'Hi there, I have a question about my booking.', time: new Date(now - 3 * 60 * 1000).toISOString() },
      { id: 'msg_1_2', sender: 'me', text: 'Sure, I can help with that. What is your booking ID?', time: new Date(now - 2 * 60 * 1000).toISOString() },
    ],
    assignedTo: '2', // Assigned to John Doe
    pinned: true,
    unread: 0,
    lastCustomerMessageAt: now - 3 * 60 * 1000,
    lastAgentMessageAt: now - 2 * 60 * 1000,
  },
  {
    id: 'conv_2',
    name: 'Liam Anderson',
    phone: '+1 212 555 1234',
    avatar: 'https://picsum.photos/seed/2/80/80',
    lastMessage: 'Is it possible to upgrade my room?',
    lastMessageTimestamp: now - 65 * 60 * 1000, // 1 hour 5 mins ago
    isWindowOpen: true,
    messages: [
      { id: 'msg_2_1', sender: 'them', text: 'Hello, I booked the Bali trip for next month.', time: new Date(now - 70 * 60 * 1000).toISOString() },
      { id: 'msg_2_2', sender: 'them', text: 'Is it possible to upgrade my room?', time: new Date(now - 65 * 60 * 1000).toISOString() },
    ],
    assignedTo: null, // Unassigned
    pinned: true,
    unread: 1,
    lastCustomerMessageAt: now - 65 * 60 * 1000,
    lastAgentMessageAt: null,
  },
  {
    id: 'conv_3',
    name: 'Sophia Rodriguez',
    phone: '+44 20 7946 0958',
    avatar: 'https://picsum.photos/seed/3/80/80',
    lastMessage: 'Perfect, thank you so much for your help!',
    lastMessageTimestamp: now - 26 * 60 * 60 * 1000, // 26 hours ago
    isWindowOpen: false, // Window is closed
    messages: [
      { id: 'msg_3_1', sender: 'them', text: 'I need to cancel my trip.', time: new Date(now - 27 * 60 * 60 * 1000).toISOString() },
      { id: 'msg_3_2', sender: 'me', text: 'I have processed the cancellation for you. Your reference is CAN-12345.', time: new Date(now - 26.5 * 60 * 60 * 1000).toISOString() },
      { id: 'msg_3_3', sender: 'them', text: 'Perfect, thank you so much for your help!', time: new Date(now - 26 * 60 * 60 * 1000).toISOString() },
    ],
    assignedTo: '3', // Assigned to Jane Appleseed
    pinned: false,
    unread: 0,
    lastCustomerMessageAt: now - 26 * 60 * 60 * 1000,
    lastAgentMessageAt: now - 26.5 * 60 * 60 * 1000,
  },
  {
    id: 'conv_4',
    name: 'Noah Campbell',
    phone: '+61 2 9250 7111',
    avatar: 'https://picsum.photos/seed/4/80/80',
    lastMessage: 'Can I add another person to my booking?',
    lastMessageTimestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    isWindowOpen: false,
    messages: [
      { id: 'msg_4_1', sender: 'them', text: 'Can I add another person to my booking?', time: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    assignedTo: null,
    pinned: false,
    unread: 0,
    lastCustomerMessageAt: now - 3 * 24 * 60 * 60 * 1000,
    lastAgentMessageAt: null,
  },
    {
    id: 'conv_5',
    name: 'Emma Dubois',
    phone: '+33 1 40 20 50 50',
    avatar: 'https://picsum.photos/seed/5/80/80',
    lastMessage: 'Can you confirm my pickup time please?',
    lastMessageTimestamp: now - 15 * 60 * 1000, // 15 mins ago
    isWindowOpen: true,
    messages: [
      { id: 'msg_5_1', sender: 'them', text: 'Can you confirm my pickup time please?', time: new Date(now - 15 * 60 * 1000).toISOString() },
    ],
    assignedTo: null,
    pinned: false,
    unread: 2,
    lastCustomerMessageAt: now - 15 * 60 * 1000,
    lastAgentMessageAt: null,
  },
];

export const mockTemplates: Template[] = [
    {
        id: 'TPL001',
        name: 'follow_up_v1',
        category: 'Utility',
        content: 'Hi {{1}}, we missed you. Is there anything else we can help you with regarding your case?',
        status: 'Approved',
    },
    {
        id: 'TPL002',
        name: 'payment_issue',
        category: 'Utility',
        content: 'Hello, we noticed an issue with your payment for booking {{1}}. Please contact us to resolve it. Thank you.',
        status: 'Approved',
    },
     {
        id: 'TPL003',
        name: 'promo_q2_2024',
        category: 'Marketing',
        content: 'Ready for a new adventure? Get 15% off our new trip to {{1}}! Limited time offer.',
        status: 'Approved',
    }
];
