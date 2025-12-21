import { supabase } from '@/lib/supabase/server'

/* =========================
   TYPES (minimal + safe)
========================= */

export type Conversation = {
  id: string
  phone: string
  name: string | null
  last_message: string | null
  last_message_at: string | null
}

export type Message = {
  id: string
  conversation_id: string
  body: string
  direction: 'inbound' | 'outbound'
  created_at: string
  status?: string
}

/* =========================
   GET ALL CONVERSATIONS
========================= */

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

/* =========================
   GET CONVERSATION BY ID
========================= */

export async function getConversationById(id: string) {
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

/* =========================
   UPDATE CONVERSATION AFTER MESSAGE
========================= */

export async function updateConversationWithMessage(
  conversationId: string,
  message: string
) {
  const { error } = await supabase
    .from('conversations')
    .update({
      last_message: message,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[conversation-store] updateConversationWithMessage failed:', error)
  }
}

/* =========================
   UPDATE MESSAGE STATUS
========================= */

export async function updateMessageStatus(
  messageId: string,
  status: string
) {
  const { error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', messageId)

  if (error) {
    console.error('[conversation-store] updateMessageStatus failed:', error)
  }
}
