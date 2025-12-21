import { NextResponse } from 'next/server';
import { getTemplates, saveTemplates } from '@/lib/template-store';
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

export async function POST(request: Request) {
     try {
        const template: Template = await request.json();
        if (!template.id || !template.name || !template.content || !template.category) {
             return NextResponse.json({ message: 'Missing required template fields' }, { status: 400 });
        }
        
        const templates = await getTemplates();
        const existingIndex = templates.findIndex(t => t.id === template.id);

        if (existingIndex > -1) {
            templates[existingIndex] = template;
        } else {
            templates.unshift(template);
        }

        await saveTemplates(templates);

        return NextResponse.json(template);
    } catch (error: any) {
        console.error('[API/Templates] Failed to save template:', error);
        return NextResponse.json({ message: 'Failed to save template' }, { status: 500 });
    }
}
