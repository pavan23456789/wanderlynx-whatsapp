import { NextResponse } from 'next/server';
import { getTemplates } from '@/lib/template-store';
import type { Template } from '@/lib/data';


export async function GET(request: Request) {
    try {
        const templates = await getTemplates();
        return NextResponse.json(templates);
    } catch (error: any) {
        console.error('[API/Templates] Failed to get templates:', error);
        return NextResponse.json({ message: 'Failed to retrieve templates' }, { status: 500 });
    }
}
