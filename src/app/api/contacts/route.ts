import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Fetch unique contacts from the 'conversations' table
    // (Since we don't have a dedicated 'contacts' table yet, we treat open conversations as contacts)
    const { data, error } = await supabase
      .from('conversations')
      .select('id, name, phone, last_message_at')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    // Transform data to match the Frontend 'Contact' type
    const contacts = data.map((c: any) => ({
      id: c.id,
      name: c.name || 'Unknown',
      phone: c.phone,
      email: '', // Not in DB yet
      trip: '',  // Not in DB yet
      tags: [],  // Not in DB yet
      avatar: `https://ui-avatars.com/api/?name=${c.name || 'U'}&background=random`,
    }));

    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('[API/Contacts] Failed to get contacts:', error);
    return NextResponse.json({ message: 'Failed to retrieve contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // NOTE: Creating a contact technically means starting a conversation in your current schema.
  // We will insert into 'conversations'.
  try {
    const body = await request.json();
    const { contact, isUpdate } = body;

    if (!contact || !contact.phone) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
    }

    if (isUpdate) {
      // Update existing conversation name
      const { error } = await supabase
        .from('conversations')
        .update({ name: contact.name })
        .eq('id', contact.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    } else {
      // Create new conversation (Contact)
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          phone: contact.phone,
          name: contact.name,
          status: 'open',
          unread: 0,
          pinned: false
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error(`[API/Contacts] Save failed:`, error);
    return NextResponse.json({ message: 'Failed to save contact' }, { status: 500 });
  }
}