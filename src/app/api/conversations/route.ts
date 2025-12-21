import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // 1️⃣ Fetch conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (convError) {
      console.error('Conversation fetch error:', convError);
      return NextResponse.json(
        { message: convError.message },
        { status: 500 }
      );
    }

    // 2️⃣ For each conversation, fetch messages
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (msgError) {
          console.error('Message fetch error:', msgError);
        }

        // 3️⃣ Convert DB message → UI message
        const formattedMessages = (messages || []).map((m) => ({
          id: m.id,
          text: m.body, // DB → UI
          sender: m.direction === 'outbound' ? 'me' : 'user',
          time: m.created_at,
          status: 'delivered',
        }));

        return {
          id: conv.id,
          name: conv.name,
          phone: conv.phone,
          avatar: '', // optional
          lastMessage: conv.last_message,
          lastMessageTimestamp: conv.last_message_at,
          unread: 0,
          messages: formattedMessages,
        };
      })
    );

    // 4️⃣ Return clean UI-ready data
    return NextResponse.json(formattedConversations);
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
