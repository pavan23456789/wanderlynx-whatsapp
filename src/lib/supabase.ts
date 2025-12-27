import { createClient } from '@supabase/supabase-js';

// Ensure we are reading the environment variables correctly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Missing Supabase URL or SERVICE_ROLE_KEY in .env.local');
}

// We export this as 'supabaseAdmin' so we know it has admin rights
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // We don't need to save sessions for backend API calls
  }
});