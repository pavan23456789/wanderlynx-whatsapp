import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Marketing' | 'Customer Support' | 'Internal Staff';
  avatar: string;
};

// ✅ REAL AUTH: Fetches the logged-in user from Supabase
export async function getCurrentUser(): Promise<User | null> {
  // 1. Get the session (Is the browser logged in?)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // 2. Get their profile details (Name, Role) from the database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
      console.warn("Profile fetch error:", error.message);
  }

  // 3. Return the user object
  return {
    id: session.user.id,
    name: profile?.full_name || session.user.email || 'User',
    email: session.user.email || '',
    avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`,
    role: profile?.role || 'Internal Staff',
  };
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/login';
}