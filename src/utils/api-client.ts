import { createClient } from './supabase/client'; 

export async function authFetch(url: string, options: RequestInit = {}) {
  const supabase = createClient();

  // Grabs the current login session
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };

  return fetch(url, { ...options, headers });
}