'use client';

import * as React from 'react';
import { Send, RefreshCw, AlertTriangle } from 'lucide-react';
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

/* =========================
   TYPES
========================= */

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
  status: string;
  components?: any[];
};

/* =========================
   TEMPLATE SENDER
========================= */

function TemplateReply({
  templates,
  onSend,
  sending,
}: {
  templates: Template[];
  onSend: (templateName: string, params: string[]) => void;
  sending: boolean;
}) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [params, setParams] = React.useState<string[]>([]);

  const template = templates.find(t => t.name === selectedTemplate);

  const paramCount = React.useMemo(() => {
    if (!template) return 0;
    const body = template.components?.find((c: any) => c.type === 'BODY');
    if (!body?.text) return 0;
    const matches = body.text.match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
  }, [template]);

  React.useEffect(() => {
    setParams(Array(paramCount).fill(''));
  }, [paramCount]);

  return (
    <div className="p-4 space-y-3 border-t">
      <div className="flex gap-2 rounded-md border border-yellow-400 bg-yellow-50 p-3 text-yellow-900">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">
          24-hour window closed. Use template message.
        </span>
      </div>

      <Select
        value={selectedTemplate}
        onValueChange={setSelectedTemplate}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select template" />
        </SelectTrigger>

        <SelectContent>
          {templates.length === 0 && (
            <SelectItem value="none" disabled>
              No approved templates
            </SelectItem>
          )}

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
        className="w-full"
        disabled={!template || sending}
        onClick={() => onSend(template!.name, params)}
      >
        <Send className="mr-2 h-4 w-4" />
        Send Template
      </Button>
    </div>
  );
}

/* =========================
   MAIN PAGE
========================= */

export default function InboxPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const { toast } = useToast();

  /* =========================
     FETCH CONVERSATIONS
  ========================= */

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error('Invalid conversations response:', data);
        setConversations([]);
        setSelected(null);
        return;
      }

      setConversations(data);
      setSelected(data[0] ?? null);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load conversations',
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FETCH TEMPLATES
  ========================= */

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();

      if (Array.isArray(data)) {
        setTemplates(data.filter(t => t.status === 'APPROVED'));
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    }
  };

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  /* =========================
     SEND TEMPLATE
  ========================= */

  const sendTemplate = async (templateName: string, params: string[]) => {
    if (!selected || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selected.id,
          templateName,
          params,
        }),
      });

      if (!res.ok) throw new Error('Send failed');

      toast({ title: 'Message sent' });
      fetchConversations();
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Send failed',
        description: e.message,
      });
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TooltipProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25}>
          <div className="p-4 space-y-4 h-full">
            <div className="flex gap-2">
              <Input
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button size="icon" onClick={fetchConversations}>
                <RefreshCw className={cn(loading && 'animate-spin')} />
              </Button>
            </div>

            <ScrollArea className="h-full">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    'w-full text-left p-3 rounded-md hover:bg-secondary',
                    selected?.id === c.id && 'bg-secondary'
                  )}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.lastMessageTimestamp
                      ? formatDistanceToNow(new Date(c.lastMessageTimestamp), {
                          addSuffix: true,
                        })
                      : 'No messages'}
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b font-semibold">
                {selected.name}
              </div>

              <ScrollArea className="flex-1 p-4 space-y-2">
                {selected.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No messages yet
                  </p>
                )}

                {selected.messages.map(m => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[70%] p-2 rounded-md text-sm',
                      m.sender === 'me'
                        ? 'ml-auto bg-blue-500 text-white'
                        : 'bg-muted'
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
