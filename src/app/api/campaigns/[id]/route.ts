import { NextResponse } from 'next/server';
import { getCampaignById } from '@/lib/campaign-store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    if (!campaignId) {
      return NextResponse.json({ message: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error(`[API/Campaigns/ID] Failed to get campaign:`, error);
    return NextResponse.json({ message: 'Failed to retrieve campaign' }, { status: 500 });
  }
}