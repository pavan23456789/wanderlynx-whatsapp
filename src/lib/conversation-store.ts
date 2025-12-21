import { supabase } from '@/lib/supabase/server'
import type { Conversation } from './data'

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[conversation-store] failed:', error)
    return []
  }

  return data ?? []
}
