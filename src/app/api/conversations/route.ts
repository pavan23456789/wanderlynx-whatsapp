import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversation fetch error:', error);
      return NextResponse.json([]);
    }

    const formatted = await Promise.all(
      (conversations ?? []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        return {
          id: conv.id,
          name: conv.name || conv.phone || 'Unknown',
          phone: conv.phone,
          avatar: '',
          unread: 0,
          lastMessage: conv.last_message || '',
          lastMessageTimestamp: conv.last_message_at,
          messages: (messages ?? []).map((m) => ({
            id: m.id,
            text: m.body,
            sender: m.direction === 'outbound' ? 'me' : 'them',
            time: m.created_at,
          })),
        };
      })
    );

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Conversations API crashed:', err);
    return NextResponse.json([]);
  }
}
