'use client';

import * as React from 'react';
import { Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ================= TYPES ================= */

type Conversation = {
  id: string;
  name: string;
  phone: string;
  last_message: string | null;
  last_message_at: string | null;
};

type Template = {
  id: string;
  name: string;
  content: string;
  status: string;
};

/* ================= PAGE ================= */

export default function InboxPage() {
  const { toast } = useToast();

  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [params, setParams] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  /* ============== FETCH DATA ============== */

  const fetchConversations = async () => {
    setLoading(true);
    const res = await fetch('/api/conversations');
    const data = await res.json();
    setConversations(data);
    if (!selected && data.length) setSelected(data[0]);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data.filter((t: Template) => t.status === 'Approved'));
  };

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  /* ============== TEMPLATE PARAMS ============== */

  React.useEffect(() => {
    const tpl = templates.find(t => t.name === selectedTemplate);
    if (!tpl) return;

    const matches = tpl.content.match(/\{\{\d+\}\}/g) || [];
    setParams(Array(new Set(matches).size).fill(''));
  }, [selectedTemplate, templates]);

  /* ============== SEND TEMPLATE ============== */

  const sendTemplate = async () => {
    if (!selected || !selectedTemplate) return;

    try {
      setSending(true);
      await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          template_name: selectedTemplate,
          variables: params,
        }),
      });

      toast({ title: 'Template sent successfully' });
    } catch {
      toast({ variant: 'destructive', title: 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div className="w-1/3 border-r p-4">
        <Button size="icon" onClick={fetchConversations}>
          <RefreshCw className={cn(loading && 'animate-spin')} />
        </Button>

        <ScrollArea className="h-full mt-4">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={cn(
                'w-full text-left p-3 rounded-lg mb-2',
                selected?.id === c.id && 'bg-secondary'
              )}
            >
              <div className="font-semibold">{c.name || c.phone}</div>
              <div className="text-sm text-muted-foreground">
                {c.last_message || 'No messages yet'}
              </div>
              {c.last_message_at && (
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.last_message_at), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* RIGHT */}
      <div className="flex-1 p-4 flex flex-col">
        {selected && (
          <>
            <div className="font-semibold mb-2">{selected.name}</div>

            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Messages will appear here via webhook
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex gap-2 items-center bg-yellow-50 text-yellow-800 p-2 rounded">
                <AlertTriangle size={16} />
                24-hour window closed. Use template message.
              </div>

              {/* ✅ NATIVE SELECT */}
              <select
                className="w-full border rounded-md p-2"
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>

              {params.map((_, i) => (
                <Input
                  key={i}
                  placeholder={`Value for {{${i + 1}}}`}
                  value={params[i]}
                  onChange={e => {
                    const copy = [...params];
                    copy[i] = e.target.value;
                    setParams(copy);
                  }}
                />
              ))}

              <Button
                className="w-full"
                disabled={!selectedTemplate || sending}
                onClick={sendTemplate}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Template
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
