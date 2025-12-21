// This is a mock authentication service.
// In a real application, you would replace this with calls to your authentication provider (e.g., Firebase Auth).

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Internal Staff';
  avatar: string;
};

// Mock user data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'admin@travonex.com',
    role: 'Super Admin',
    avatar: 'https://picsum.photos/seed/8/80/80',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john.doe@travonex.com',
    role: 'Internal Staff',
    avatar: 'https://picsum.photos/seed/9/40/40',
  },
];

export function login(email: string, password: string): Promise<User | null> {
  return new Promise((resolve) => {
    // Mock API delay
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email);
      // In a real app, you'd also check the password hash. Here we just check if user exists.
      if (user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
        resolve(user);
      } else {
        resolve(null);
      }
    }, 500);
  });
}

export function logout(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    resolve();
  });
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
}
