import { supabase } from '@/lib/supabase/server'

/**
 * Get all conversations
 */
export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[getConversations]', error)
    return []
  }

  return data ?? []
}

/**
 * Get single conversation by ID
 */
export async function getConversationById(id: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getConversationById]', error)
    return null
  }

  return data
}

/**
 * Update conversation last message
 */
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
    console.error('[updateConversationWithMessage]', error)
  }
}

/**
 * Update message status (stub for now)
 */
export async function updateMessageStatus(
  messageId: string,
  status: string
) {
  const { error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', messageId)

  if (error) {
    console.error('[updateMessageStatus]', error)
  }
}
