import type { Conversation } from '@/lib/data';

export const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Olivia Martin',
    avatar: 'https://picsum.photos/seed/1/40/40',
    lastMessage: 'Sure, I can help with that. What is your booking ID?',
    time: '2m ago',
    unread: 0,
    messages: [],
    lastMessageTimestamp: new Date().getTime() - 2 * 60 * 1000,
  },
  {
    id: '2',
    name: 'Liam Anderson',
    avatar: 'https://picsum.photos/seed/2/40/40',
    lastMessage: "Thanks for the update! I'll be waiting.",
    time: '1h ago',
    unread: 2,
    messages: [],
    lastMessageTimestamp: new Date().getTime() - 60 * 60 * 1000,
  },
  {
    id: '3',
    name: 'Sophia Rodriguez',
    avatar: 'https://picsum.photos/seed/3/40/40',
    lastMessage: 'Is the payment due today?',
    time: 'yesterday',
    unread: 0,
    messages: [],
    lastMessageTimestamp: new Date().getTime() - 24 * 60 * 60 * 1000,
  },
  {
    id: '4',
    name: 'Noah Campbell',
    avatar: 'https://picsum.photos/seed/4/40/40',
    lastMessage: 'Perfect, thank you so much for your help!',
    time: '3d ago',
    unread: 0,
    messages: [],
    lastMessageTimestamp: new Date().getTime() - 3 * 24 * 60 * 60 * 1000,
  },
];
