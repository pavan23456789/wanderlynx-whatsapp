import * as fs from 'fs/promises';
import * as path from 'path';
import type { Template } from './data';

const TEMPLATES_FILE_PATH = path.join(process.cwd(), 'logs', 'templates.json');

type TemplateStore = {
    templates: Template[];
};

/**
 * Ensures the log directory and file exist, and returns the template data.
 */
async function getStore(): Promise<TemplateStore> {
    try {
        await fs.mkdir(path.dirname(TEMPLATES_FILE_PATH), { recursive: true });
        const data = await fs.readFile(TEMPLATES_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const initialTemplates: Template[] = [
                { id: "TPL001", name: "welcome_message", category: "Marketing", content: "Hello {{1}}! Welcome to Wanderlynx. How can we help you plan your next adventure?", status: "Approved" },
                { id: "booking_confirmation_v1", name: "booking_confirmation_v1", category: "Utility", content: "Hi {{1}}, your booking for {{2}} is confirmed! Your booking ID is {{3}}. We can't wait to see you!", status: "Approved" },
                { id: "payment_pending_v1", name: "payment_pending_v1", category: "Utility", content: "Just a friendly reminder that a payment of {{1}} is due on {{2}}. Please let us know if you have any questions.", status: "Approved" },
                { id: "TPL004", name: "summer_promo", category: "Marketing", content: "Don't miss out on our summer sale! Get up to 20% off on select packages.", status: "Approved" },
                { id: "TPL005", name: "new_year_promo", category: "Marketing", content: "Don't miss out on our new year sale! Get up to 30% off on all packages.", status: "Rejected" },
            ];
            const defaultStore: TemplateStore = { templates: initialTemplates };
            await fs.writeFile(TEMPLATES_FILE_PATH, JSON.stringify(defaultStore, null, 2));
            return defaultStore;
        }
        console.error('[TemplateStore] Failed to read templates file:', error);
        return { templates: [] };
    }
}

/**
 * Writes the provided data to the templates file.
 */
async function writeStore(store: TemplateStore): Promise<void> {
    try {
        await fs.writeFile(TEMPLATES_FILE_PATH, JSON.stringify(store, null, 2));
    } catch (error) {
        console.error('[TemplateStore] Failed to write to templates file:', error);
    }
}

/**
 * Retrieves all templates.
 */
export async function getTemplates(): Promise<Template[]> {
    const store = await getStore();
    return store.templates;
}

/**
 * Saves all templates.
 */
export async function saveTemplates(templates: Template[]): Promise<void> {
    const store = { templates };
    await writeStore(store);
}
