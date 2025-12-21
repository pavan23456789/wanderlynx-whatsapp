import { NextResponse } from 'next/server';
import { getContacts, addContact, updateContact } from '@/lib/contact-store';
import type { Contact } from '@/lib/data';

export async function GET(request: Request) {
    try {
        const contacts = await getContacts();
        return NextResponse.json(contacts);
    } catch (error: any) {
        console.error('[API/Contacts] Failed to get contacts:', error);
        return NextResponse.json({ message: 'Failed to retrieve contacts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { contact, isUpdate } = body;

        if (!contact || !contact.id || !contact.name || !contact.phone) {
            return NextResponse.json({ message: 'Missing required contact fields' }, { status: 400 });
        }
        
        let savedContact: Contact;
        if (isUpdate) {
            savedContact = await updateContact(contact);
        } else {
            savedContact = await addContact(contact);
        }

        return NextResponse.json(savedContact);
    } catch (error: any) {
        console.error(`[API/Contacts] Failed to ${'isUpdate' in (await request.json()) ? 'update' : 'create'} contact:`, error);
        return NextResponse.json({ message: 'Failed to save contact' }, { status: 500 });
    }
}
