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

/* =====================
   TYPES
===================== */

type Conversation = {
  id: string;
  name: string;
  phone: string;
  lastMessage: string | null;
  lastMessageTimestamp: string | null;
};

type Template = {
  id: string;
  name: string;
  content: string;
  status: string;
};

/* =====================
   TEMPLATE REPLY
===================== */

function TemplateReply({
  templates,
  onSend,
  sending,
}: {
  templates: Template[];
  onSend: (templateName: string, params: string[]) => void;
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
      <div className="flex gap-2 rounded-lg border border-yellow-400 bg-yellow-50 p-3 text-yellow-900">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-medium">
          24-hour window closed. Use template message.
        </p>
      </div>

      {/* TEMPLATE SELECT */}
      <Select
        value={selected?.name ?? ''}
        onValueChange={(v) =>
          setSelected(templates.find((t) => t.name === v) || null)
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>

        <SelectContent
          position="popper"
          side="top"
          sideOffset={8}
          className="z-[9999]"
        >
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* PARAM INPUTS */}
      {params.map((value, i) => (
        <Input
          key={i}
          placeholder={`Value for {{${i + 1}}}`}
          value={value}
          onChange={(e) => {
            const copy = [...params];
            copy[i] = e.target.value;
            setParams(copy);
          }}
        />
      ))}

      <Button
        className="w-full"
        disabled={!selected || sending}
        onClick={() => selected && onSend(selected.name, params)}
      >
        <Send className="mr-2 h-4 w-4" />
        Send Template
      </Button>
    </div>
  );
}

/* =====================
   MAIN PAGE
===================== */

export default function InboxPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const { toast } = useToast();

  /* FETCH CONVERSATIONS */
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');

      const data = await res.json();
      setConversations(data);

      if (!selected && data.length) {
        setSelected(data[0]);
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* FETCH TEMPLATES */
  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    if (!res.ok) return;

    const data = await res.json();
    setTemplates(data.filter((t: Template) => t.status === 'Approved'));
  };

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  /* SEND TEMPLATE */
  const sendTemplate = async (template: string, params: string[]) => {
    if (!selected) return;

    setSending(true);
    try {
      const res = await fetch('/api/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selected.id,
          templateName: template,
          params,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      toast({
        title: 'Message sent',
        description: 'WhatsApp template sent successfully',
      });

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

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TooltipProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* LEFT */}
        <ResizablePanel defaultSize={25}>
          <div className="h-full p-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button size="icon" onClick={fetchConversations}>
                <RefreshCw className={cn(loading && 'animate-spin')} />
              </Button>
            </div>

            <ScrollArea className="h-full">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg hover:bg-secondary',
                    selected?.id === c.id && 'bg-secondary'
                  )}
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.lastMessageTimestamp
                      ? formatDistanceToNow(
                          new Date(c.lastMessageTimestamp),
                          { addSuffix: true }
                        )
                      : 'No messages yet'}
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* RIGHT */}
        <ResizablePanel defaultSize={75}>
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b font-semibold">
                {selected.name}
              </div>

              <div className="flex-1 p-4 text-muted-foreground text-sm">
                Messages will appear here via webhook.
              </div>

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
