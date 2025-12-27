import { NextResponse } from 'next/server';
import { 
    createCampaign, 
    getCampaigns, 
    updateCampaignStatus 
} from '@/lib/campaign-store';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp';
import { getContacts } from '@/lib/contact-store';

export async function GET(request: Request) {
    try {
        const campaigns = await getCampaigns();
        return NextResponse.json(campaigns);
    } catch (error: any) {
        console.error('[API/Campaigns] Failed to get campaigns:', error);
        return NextResponse.json({ message: 'Failed to retrieve campaigns' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, templateName, templateContent, variables } = body;

        if (!name || !templateName || !templateContent) {
            return NextResponse.json({ message: 'Missing required campaign fields' }, { status: 400 });
        }

        const contacts = await getContacts();
        if (contacts.length === 0) {
            return NextResponse.json({ message: 'No contacts to send to' }, { status: 400 });
        }
        
        // 1. Create the campaign entry in DB
        const newCampaign = await createCampaign({
            name,
            templateName,
            templateContent,
            variables: variables || {}, // Fix: Ensure variables object exists
            audienceCount: contacts.length
        });
        
        // 2. CRITICAL FIX: We must AWAIT this, or Vercel will kill the process immediately.
        await processCampaign(newCampaign.id);

        return NextResponse.json(newCampaign, { status: 201 });

    } catch (error: any) {
        console.error(`[API/Campaigns] Failed to create campaign:`, error);
        return NextResponse.json({ message: 'Failed to create campaign' }, { status: 500 });
    }
}

async function processCampaign(campaignId: string) {
    console.log(`[Campaigns] Starting to process campaign ${campaignId}`);

    await updateCampaignStatus(campaignId, 'Sending', { message: 'Fetching contacts...' });
    
    const contacts = await getContacts();
    
    // Safety check: if campaign failed to create or fetch
    const campaign = await updateCampaignStatus(campaignId, 'Sending', { 
        message: `Sending to ${contacts.length} contacts...` 
    });

    if (!campaign) {
        console.error(`[Campaigns] Failed to find campaign ${campaignId} to process.`);
        return;
    }

    for (const contact of contacts) {
        try {
            // Replace template variables logic
            let messageBody = campaign.templateContent || "";
            const params: string[] = [];
            
            // Handle {{1}}, {{2}} variables
            if(campaign.variables) {
                const sortedVarKeys = Object.keys(campaign.variables).sort((a, b) => parseInt(a) - parseInt(b));
                for(const key of sortedVarKeys) {
                    const value = campaign.variables[key] as string;
                    params.push(value);
                    messageBody = messageBody.replace(`{{${key}}}`, value);
                }
            }
            
            // Send the actual message via WhatsApp API
            await sendWhatsAppTemplateMessage(contact.phone, campaign.templateName, params);
            
            // Update stats
            await updateCampaignStatus(campaignId, 'Sending', {
                incrementSent: true,
                message: `Sent to ${contact.phone}`,
                contactId: contact.id
            });

        } catch (error: any) {
            console.error(`[Campaigns] Failed to send to ${contact.phone}:`, error.message);
            await updateCampaignStatus(campaignId, 'Sending', {
                incrementFailed: true,
                message: `Failed to send to ${contact.phone}: ${error.message}`,
                contactId: contact.id,
                error: error.message,
            });
        }
    }
    
    await updateCampaignStatus(campaignId, 'Completed', { message: 'All messages processed.' });
    console.log(`[Campaigns] Finished processing campaign ${campaignId}`);
}