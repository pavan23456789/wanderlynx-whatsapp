import type { Conversation } from '@/lib/data';
import { mockConversations } from './mockConversations';

export type DashboardStats = {
  totalContacts: number;
  activeCampaigns: number;
  totalTemplates: number;
  recentConversations: Conversation[];
  messagesSent: number;
};

export const mockDashboardStats: DashboardStats = {
  totalContacts: 1489,
  activeCampaigns: 3,
  totalTemplates: 24,
  recentConversations: mockConversations.slice(0, 4),
  messagesSent: 25730,
};

export const chartdata = [
    { name: 'Mon', messages: 186 },
    { name: 'Tue', messages: 305 },
    { name: 'Wed', messages: 237 },
    { name: 'Thu', messages: 273 },
    { name: 'Fri', messages: 209 },
    { name: 'Sat', messages: 214 },
    { name: 'Sun', messages: 345 },
  ];
