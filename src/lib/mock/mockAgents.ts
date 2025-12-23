// This file contains mock data for agents who can be assigned to conversations.
// In a real application, this would come from a user management system.

export type Agent = {
  id: string;
  name: string;
  avatar: string;
};

export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Super Admin',
    avatar: 'https://picsum.photos/seed/8/80/80',
  },
  {
    id: '2',
    name: 'John Doe',
    avatar: 'https://picsum.photos/seed/9/40/40',
  },
  {
    id: '3',
    name: 'Jane Appleseed',
    avatar: 'https://picsum.photos/seed/10/40/40',
  },
];
