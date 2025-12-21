import { supabase } from '@/lib/supabase/server'
import type { Conversation, Message } from './data'

export async function getConversations(): Promise<Conversation[]> {
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

export async function getConversationById(id: string): Promise<Conversation | null> {
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

export async function updateConversationWithMessage(
  conversationId: string,
  message: Partial<Message>
) {
  const { error } = await supabase
    .from('conversations')
    .update({
      last_message: message.text,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[updateConversationWithMessage]', error)
  }
}

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
