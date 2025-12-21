import { supabase } from '@/lib/supabase/server'

/* =========================
   TYPES
========================= */

export type Conversation = {
  id: string
  phone: string
  name: string | null
  last_message: string | null
  last_message_at: string | null
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
   GET SINGLE CONVERSATION
========================= */

export async function getConversationById(
  id: string
): Promise<Conversation | null> {
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
   UPDATE CONVERSATION MESSAGE
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
    console.error(
      '[conversation-store] updateConversationWithMessage failed:',
      error
    )
  }
}

/* =========================
   UPDATE MESSAGE STATUS
   (SAFE PLACEHOLDER)
========================= */

export async function updateMessageStatus(
  _messageId: string,
  _status: string
) {
  // intentionally left blank
  // prevents runtime import crash
  return
}
