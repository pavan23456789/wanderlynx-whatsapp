import { supabaseAdmin } from './supabase';
import type { Template } from './data';

// FETCH: Get all templates from Supabase
export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabaseAdmin
    .from('whatsapp_templates')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[TemplateStore] Failed to fetch templates:', error);
    return [];
  }

  // Map database columns to your frontend Template type
  return data.map((row: any) => ({
    id: row.id.toString(), // Convert number ID to string
    name: row.name,
    category: row.category,
    content: row.body_text, // Map 'body_text' to 'content'
    status: row.status === 'APPROVED' ? 'Approved' : 'Pending',
    components: row.buttons_config || []
  }));
}

// RENDER: Helper to replace {{1}} with real text
export async function renderTemplateByName(
  templateName: string,
  params: string[]
): Promise<string> {
  // For performance, you might want to cache this in memory later
  const templates = await getTemplates();
  const template = templates.find((t) => t.name === templateName);

  if (!template) return `${templateName}: ${params.join(', ')}`;

  let rendered = template.content;
  params.forEach((val, idx) => {
    rendered = rendered.replace(`{{${idx + 1}}}`, val);
  });

  return rendered;
}

// SAVE: (Optional) If you build a template editor later
export async function saveTemplates(templates: Template[]): Promise<void> {
    console.warn("Saving templates via API is not yet implemented. Manage them in Supabase.");
}