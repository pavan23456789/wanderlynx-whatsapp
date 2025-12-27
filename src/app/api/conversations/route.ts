import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = getSupabaseServerClient(cookieStore);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API/Conversations] Unauthorized: No user session found.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.app_metadata?.role;
    const allowedRoles = ['Super Admin', 'Customer Support', 'Marketing'];

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn(`[API/Conversations] Forbidden: User with role '${userRole}' attempted to access.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Original logic starts here
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
