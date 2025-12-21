import * as fs from 'fs/promises';
import * as path from 'path';
import type { Contact } from './data';

const CONTACTS_FILE_PATH = path.join(process.cwd(), 'logs', 'contacts.json');

type ContactStore = {
    contacts: Contact[];
};

/**
 * Ensures the log directory and file exist, and returns the contact data.
 */
async function getStore(): Promise<ContactStore> {
    try {
        await fs.mkdir(path.dirname(CONTACTS_FILE_PATH), { recursive: true });
        const data = await fs.readFile(CONTACTS_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const defaultStore: ContactStore = { contacts: [] };
            await fs.writeFile(CONTACTS_FILE_PATH, JSON.stringify(defaultStore, null, 2));
            return defaultStore;
        }
        console.error('[ContactStore] Failed to read contacts file:', error);
        return { contacts: [] };
    }
}

/**
 * Writes the provided data to the contacts file.
 */
async function writeStore(store: ContactStore): Promise<void> {
    try {
        await fs.writeFile(CONTACTS_FILE_PATH, JSON.stringify(store, null, 2));
    } catch (error) {
        console.error('[ContactStore] Failed to write to contacts file:', error);
    }
}

/**
 * Retrieves all contacts.
 */
export async function getContacts(): Promise<Contact[]> {
    const store = await getStore();
    return store.contacts;
}

/**
 * Retrieves a single contact by their phone number.
 */
export async function getContactByPhone(phone: string): Promise<Contact | undefined> {
    const contacts = await getContacts();
    return contacts.find(c => c.phone === phone);
}

/**
 * Adds a new contact to the store.
 */
export async function addContact(contact: Contact): Promise<Contact> {
    const store = await getStore();
    const existing = store.contacts.find(c => c.phone === contact.phone);
    if (existing) {
        // Optionally, could throw an error or update the existing contact
        console.warn(`[ContactStore] Contact with phone ${contact.phone} already exists.`);
        return existing;
    }
    store.contacts.unshift(contact); // Add to top of the list
    await writeStore(store);
    return contact;
}

/**
 * Updates an existing contact.
 */
export async function updateContact(contact: Contact): Promise<Contact> {
     const store = await getStore();
    const index = store.contacts.findIndex(c => c.id === contact.id);
    if (index === -1) {
        throw new Error(`Contact with ID ${contact.id} not found.`);
    }
    store.contacts[index] = contact;
    await writeStore(store);
    return contact;
}
