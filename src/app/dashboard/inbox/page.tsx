'use client';

import * as React from 'react';
import { Search, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/* ================= TYPES ================= */

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
};

type Conversation = {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTimestamp: string | null;
  messages: Message[];
};

type Template = {
  id: string;
  name: string;
  content: string;
  status: string;
};

/* ================= TEMPLATE REPLY ================= */

function TemplateReply({
  templates,
  onSend,
  sending,
}: {
  templates: Template[];
  onSend: (template: Template, params: string[]) => void;
  sending: boolean;
}) {
  const [selected, setSelected] = React.useState<Template | null>(null);
  const [params, setParams] = React.useState<string[]>([]);

  const paramCount = React.useMemo(() => {
    if (!selected) return 0;
    const matches = selected.content.match(/\{\{\d+\}\}/g);
    return matches ? new Set(matches).size : 0;
  }, [selected]);

  React.useEffect(() => {
    setParams(Array(paramCount).fill(''));
  }, [paramCount]);

  return (
    <div className="p-4 border-t space-y-3">
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 text-yellow-900 p-2 rounded-md text-sm">
        <AlertTriangle className="h-4 w-4" />
        24-hour window closed. Use template message.
      </div>

      <Select onValueChange={(v) => setSelected(templates.find(t => t.name === v) || null)}>
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
        disabled={!selected || sending}
        onClick={() => selected && onSend(selected, params)}
        className="w-full"
      >
        <Send className="h-4 w-4 mr-2" />
        Send Template
      </Button>
    </div>
  );
}

/* ================= MAIN PAGE ================= */

export default function InboxPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const { toast } = useToast();

  /* ===== FETCH CONVERSATIONS ===== */

  const fetchConversations = async () => {
    setLoading(true);
    const res = await fetch('/api/conversations');
    const data = await res.json();

    const normalized = data.map((c: any) => ({
      id: c.id,
      name: c.name || c.phone || 'Unknown',
      phone: c.phone,
      lastMessage: c.last_message || '',
      lastMessageTimestamp: c.updated_at || null,
      messages: [],
    }));

    setConversations(normalized);
    setSelected(prev => prev ? normalized.find(c => c.id === prev.id) : normalized[0]);
    setLoading(false);
  };

  /* ===== FETCH TEMPLATES ===== */

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data.filter((t: Template) => t.status === 'Approved'));
  };

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  /* ===== SEND TEMPLATE ===== */

  const sendTemplate = async (template: Template, params: string[]) => {
    if (!selected) return;
    setSending(true);

    try {
      await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          template_name: template.name,
          variables: params,
        }),
      });

      const rendered = template.content.replace(/\{\{(\d+)\}\}/g, (_, i) => params[i - 1]);

      const message: Message = {
        id: crypto.randomUUID(),
        text: rendered,
        sender: 'me',
        time: new Date().toISOString(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === selected.id
            ? {
                ...c,
                messages: [...c.messages, message],
                lastMessage: rendered,
                lastMessageTimestamp: message.time,
              }
            : c
        )
      );

      toast({ title: 'Message sent' });
    } catch {
      toast({ variant: 'destructive', title: 'Send failed' });
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ===== RENDER ===== */

  return (
    <TooltipProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25}>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
              <Button size="icon" onClick={fetchConversations}>
                <RefreshCw className={cn(loading && 'animate-spin')} />
              </Button>
            </div>

            <ScrollArea>
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg hover:bg-secondary',
                    selected?.id === c.id && 'bg-secondary'
                  )}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.lastMessage}</div>
                </button>
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b font-medium">{selected.name}</div>

              <ScrollArea className="flex-1 p-4 space-y-2">
                {selected.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}

                {selected.messages.map(m => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[70%] p-2 rounded-lg text-sm',
                      m.sender === 'me'
                        ? 'ml-auto bg-blue-500 text-white'
                        : 'bg-gray-200'
                    )}
                  >
                    {m.text}
                  </div>
                ))}
              </ScrollArea>

              <TemplateReply
                templates={templates}
                onSend={sendTemplate}
                sending={sending}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              Select a conversation
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
