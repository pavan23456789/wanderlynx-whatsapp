import { NextResponse } from 'next/server';
import { getTemplates } from '@/lib/template-store';
import type { Template } from '@/lib/data';

export async function GET(request: Request) {
    try {
        const templates: Template[] = await getTemplates();
        const approvedTemplates = templates.filter(t => t.status === 'Approved');
        return NextResponse.json(approvedTemplates);
    } catch (error: any) {
        console.error('[API/Templates] Failed to get templates:', error);
        return NextResponse.json({ message: 'Failed to retrieve templates' }, { status: 500 });
    }
}
