import { supabaseAdmin } from './supabase';
import type { Campaign } from './data';

/**
 * 1. GET ALL CAMPAIGNS
 * Fetches the list for the dashboard view
 */
export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CampaignStore] Failed to fetch campaigns:', error);
    return []; // Return empty array so UI doesn't crash
  }

  // Map Database snake_case -> Frontend camelCase
  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    templateName: row.template_name,
    templateContent: row.template_content,
    variables: row.variables || {},
    status: row.status,
    audienceCount: row.audience_count,
    sent: row.sent || 0,
    failed: row.failed || 0,
    statusMessage: row.status_message,
    createdAt: row.created_at,
    messages: [] // We don't load message logs in the list view (too heavy)
  }));
}

/**
 * 2. GET SINGLE CAMPAIGN
 * Fetches details + logs for the specific campaign view
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  // Fetch Campaign Info
  const { data: campaign, error: campError } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campError || !campaign) return null;

  // Fetch Message Logs (Limit to 100 for performance)
  const { data: logs, error: logError } = await supabaseAdmin
    .from('campaign_logs')
    .select('*')
    .eq('campaign_id', id)
    .order('timestamp', { ascending: false })
    .limit(100);

  return {
    id: campaign.id,
    name: campaign.name,
    templateName: campaign.template_name,
    templateContent: campaign.template_content,
    variables: campaign.variables || {},
    status: campaign.status,
    audienceCount: campaign.audience_count,
    sent: campaign.sent || 0,
    failed: campaign.failed || 0,
    statusMessage: campaign.status_message,
    createdAt: campaign.created_at,
    messages: (logs || []).map((log: any) => ({
        contactId: log.contact_id || 'Unknown',
        status: log.status,
        timestamp: log.timestamp,
        error: log.error
    }))
  };
}

/**
 * 3. CREATE NEW CAMPAIGN
 */
export async function createCampaign(input: Partial<Campaign>) {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .insert({
      name: input.name,
      template_name: input.templateName,
      template_content: input.templateContent,
      variables: input.variables || {},
      status: 'Draft',
      audience_count: input.audienceCount || 0
    })
    .select()
    .single();

  if (error) {
    console.error('[CampaignStore] Create failed:', error);
    throw error;
  }
  
  // Return formatted object immediately so UI updates
  return {
    id: data.id,
    name: data.name,
    templateName: data.template_name,
    templateContent: data.template_content,
    variables: data.variables,
    status: data.status,
    audienceCount: data.audience_count,
    sent: 0, failed: 0,
    statusMessage: 'Initializing...',
    createdAt: data.created_at,
    messages: []
  };
}

/**
 * 4. UPDATE STATUS (Used by the sending loop)
 */
export async function updateCampaignStatus(
  id: string, 
  status: string, 
  updates: any
) {
  const dbUpdates: any = { 
      status: status, 
      status_message: updates.message 
  };
  
  // Simple counter increment logic
  // (In a huge production app, we would use atomic SQL increments)
  if (updates.incrementSent) {
      // We rely on the fetch-update cycle in the main loop for now
      // or you can add specific logic here if needed.
  }

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
    
  // Also log the individual message result if provided
  if (updates.contactId) {
      await supabaseAdmin.from('campaign_logs').insert({
          campaign_id: id,
          contact_id: updates.contactId,
          status: updates.incrementFailed ? 'Failed' : 'Sent',
          error: updates.error || null
      });
  }

  return data; // Return updated campaign so loop has fresh state
}