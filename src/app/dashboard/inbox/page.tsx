'use client';

import * as React from 'react';
import { Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [params, setParams] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  /* ============== FETCH CONVERSATIONS ============== */

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
      if (!selected && data.length > 0) {
        setSelected(data[0]);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to load conversations',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ============== FETCH TEMPLATES ============== */

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
    const template = templates.find(t => t.name === selectedTemplate);
    if (!template) return;

    const matches = template.content.match(/\{\{\d+\}\}/g) || [];
    setParams(Array(new Set(matches).size).fill(''));
  }, [selectedTemplate, templates]);

  /* ============== SEND TEMPLATE ============== */

  const sendTemplate = async () => {
    if (!selected || !selectedTemplate) return;

    try {
      setSending(true);
      const res = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          template_name: selectedTemplate,
          variables: params,
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: 'Message sent',
        description: 'WhatsApp template sent successfully',
      });

      fetchConversations();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Send failed',
      });
    } finally {
      setSending(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div className="w-1/3 border-r p-4">
        <div className="flex gap-2 mb-4">
          <Button size="icon" onClick={fetchConversations}>
            <RefreshCw className={cn(loading && 'animate-spin')} />
          </Button>
        </div>

        <ScrollArea className="h-full">
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
        {selected ? (
          <>
            <div className="font-semibold mb-4">{selected.name}</div>

            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Messages will appear here via webhook
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex gap-2 items-center text-yellow-800 bg-yellow-50 p-2 rounded">
                <AlertTriangle size={18} />
                24-hour window closed. Use template message.
              </div>

              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {params.map((p, i) => (
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
                onClick={sendTemplate}
                disabled={!selectedTemplate || sending}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Template
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
