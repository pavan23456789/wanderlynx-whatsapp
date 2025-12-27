import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // ✅ Fetch from the REAL 'contacts' table now
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API/Contacts] Error:', error);
    return NextResponse.json({ message: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contact, isUpdate } = body;

    // Validate
    if (!contact?.phone || !contact?.name) {
      return NextResponse.json({ message: 'Name and Phone are required' }, { status: 400 });
    }

    if (isUpdate) {
      // ✅ Update Contact
      const { error } = await supabase
        .from('contacts')
        .update({
          name: contact.name,
          email: contact.email,
          tags: contact.tags,
          trip_details: contact.trip // 'trip' in UI maps to 'trip_details' in DB
        })
        .eq('id', contact.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    } else {
      // ✅ Create New Contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          tags: contact.tags || [],
          avatar: `https://ui-avatars.com/api/?name=${contact.name}&background=random`
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error(`[API/Contacts] Save failed:`, error);
    // Handle duplicate phone numbers gracefully
    if (error.code === '23505') { // Postgres error for unique violation
        return NextResponse.json({ message: 'A contact with this phone number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to save contact' }, { status: 500 });
  }
}