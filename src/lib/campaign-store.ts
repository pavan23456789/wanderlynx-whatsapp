import * as fs from 'fs/promises';
import * as path from 'path';
import type { Campaign } from './data';

const CAMPAIGNS_FILE_PATH = path.join(process.cwd(), 'logs', 'campaigns.json');

type CampaignStore = {
    campaigns: Campaign[];
};

async function getStore(): Promise<CampaignStore> {
    try {
        await fs.mkdir(path.dirname(CAMPAIGNS_FILE_PATH), { recursive: true });
        const data = await fs.readFile(CAMPAIGNS_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const defaultStore: CampaignStore = { campaigns: [] };
            await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(defaultStore, null, 2));
            return defaultStore;
        }
        console.error('[CampaignStore] Failed to read campaigns file:', error);
        return { campaigns: [] };
    }
}

async function writeStore(store: CampaignStore): Promise<void> {
    try {
        await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(store, null, 2));
    } catch (error) {
        console.error('[CampaignStore] Failed to write to campaigns file:', error);
    }
}

export async function getCampaigns(): Promise<Campaign[]> {
    const store = await getStore();
    // Sort by most recent first
    return store.campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
    const campaigns = await getCampaigns();
    return campaigns.find(c => c.id === id);
}

export async function createCampaign(data: {
    name: string;
    templateName: string;
    templateContent: string;
    variables: Record<string, string>;
    audienceCount: number;
}): Promise<Campaign> {
    const store = await getStore();
    const newCampaign: Campaign = {
        id: `CAMP${Date.now()}`,
        name: data.name,
        templateName: data.templateName,
        templateContent: data.templateContent,
        variables: data.variables,
        status: 'Draft',
        audienceCount: data.audienceCount,
        sent: 0,
        failed: 0,
        statusMessage: 'Campaign created and is waiting to be processed.',
        createdAt: new Date().toISOString(),
        messages: [],
    };
    store.campaigns.unshift(newCampaign);
    await writeStore(store);
    return newCampaign;
}

type CampaignUpdateOptions = {
    message?: string;
    incrementSent?: boolean;
    incrementFailed?: boolean;
    contactId?: string;
    error?: string;
}

export async function updateCampaignStatus(
    campaignId: string,
    status: 'Draft' | 'Sending' | 'Completed' | 'Failed',
    options: CampaignUpdateOptions = {}
): Promise<Campaign | undefined> {
    const store = await getStore();
    const campaignIndex = store.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) {
        console.error(`[CampaignStore] Campaign with ID ${campaignId} not found for update.`);
        return undefined;
    }

    const campaign = store.campaigns[campaignIndex];
    campaign.status = status;
    if(options.message) {
        campaign.statusMessage = options.message;
    }

    if(options.incrementSent && options.contactId) {
        campaign.sent += 1;
        campaign.messages.push({ contactId: options.contactId, status: 'Sent', timestamp: new Date().toISOString() });
    }
    
    if(options.incrementFailed && options.contactId) {
        campaign.failed += 1;
        campaign.messages.push({ contactId: options.contactId, status: 'Failed', timestamp: new Date().toISOString(), error: options.error });
    }
    
    // Ensure messages are sorted by timestamp for detail view
    campaign.messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    store.campaigns[campaignIndex] = campaign;
    await writeStore(store);
    return campaign;
}