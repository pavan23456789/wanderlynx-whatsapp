// src/lib/conversation-store.ts

import { supabase } from '@/lib/supabase/server'
import type { Conversation } from './data'

/**
 * Get all conversations (Inbox list)
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[conversation-store] getConversations failed:', error)
    return []
  }

  return data ?? []
}

/**
 * Get single conversation by ID
 */
export async function getConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[conversation-store] getConversationById failed:', error)
    return null
  }

  return data
}

/**
 * Update conversation when a new message is sent/received
 */
export async function updateConversationWithMessage(
  conversationId: string,
  lastMessage: string
) {
  const { error } = await supabase
    .from('conversations')
    .update({
      last_message: lastMessage,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[conversation-store] updateConversationWithMessage failed:', error)
    throw error
  }
}
