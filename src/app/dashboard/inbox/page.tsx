'use client';

import * as React from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isAfter, subHours } from 'date-fns';

/* =========================
   Types (local safety)
========================= */

type Message = {
  id: string;
  text: string;
  time: string;
  sender: 'me' | 'them';
  status?: string;
};

type Conversation = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  unread: number;
  lastMessage: string;
  lastMessageTimestamp: string;
  messages: Message[];
};

type Template = {
  id: string;
  name: string;
  content: string;
  status: string;
};

/* =========================
   Template Reply Component
========================= */

function TemplateReply({
  templates,
  onReply,
  isSending,
}: {
  templates: Template[];
  onReply: (text: string, params: string[]) => void;
  isSending: boolean;
}) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [params, setParams] = React.useState<string[]>([]);

  const paramCount = React.useMemo(() => {
    if (!selectedTemplate) return 0;
    const matches = selectedTemplate.content.match(/\{\{\d+\}\}/g);
    return matches ? new Set(matches).size : 0;
  }, [selectedTemplate]);

  React.useEffect(() => {
    setParams(Array(paramCount).fill(''));
  }, [paramCount]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2 rounded-xl border border-yellow-500 bg-yellow-50 p-3 text-yellow-900">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-medium">
          24-hour window closed. Use template reply.
        </p>
      </div>

      <Select onValueChange={(v) => setSelectedTemplate(templates.find(t => t.name === v) || null)}>
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
        className="w-full"
        disabled={!selectedTemplate || isSending}
        onClick={() => selectedTemplate && onReply(selectedTemplate.name, params)}
      >
        <Send className="mr-2 h-4 w-4" />
        Send Template
      </Button>
    </div>
  );
}

/* =========================
   MAIN INBOX PAGE
========================= */

export default function InboxPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = React.useState<Conversation | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const { toast } = useToast();

  /* =========================
     FETCH CONVERSATIONS
  ========================= */

  const fetchConversations = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');

      const raw = await res.json();

      // 🔑 NORMALIZATION (CRITICAL FIX)
      const normalized: Conversation[] = raw.map((c: any) => ({
        id: c.id,
        name: c.name || c.phone,
        phone: c.phone,
        avatar: '',
        unread: 0,
        lastMessage: c.last_message,
        lastMessageTimestamp: c.last_message_at,
        messages: [], // prevents UI crash
      }));

      setConversations(normalized);
      setSelectedConv(prev =>
        prev ? normalized.find(c => c.id === prev.id) || normalized[0] : normalized[0]
      );
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /* =========================
     FETCH TEMPLATES
  ========================= */

  const fetchTemplates = React.useCallback(async () => {
    const res = await fetch('/api/templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.filter((t: Template) => t.status === 'Approved'));
    }
  }, []);

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
    const i = setInterval(fetchConversations, 15000);
    return () => clearInterval(i);
  }, [fetchConversations, fetchTemplates]);

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async (text: string, params?: string[]) => {
    if (!selectedConv || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedConv.id,
          text,
          templateParams: params,
        }),
      });

      if (!res.ok) throw new Error('Send failed');
      await fetchConversations();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Send failed', description: e.message });
    } finally {
      setSending(false);
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <TooltipProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25}>
          <div className="h-full p-4 space-y-4">
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
                  onClick={() => setSelectedConv(c)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl hover:bg-secondary',
                    selectedConv?.id === c.id && 'bg-secondary'
                  )}
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {c.lastMessage}
                  </div>
                  <div className="text-xs">
                    {formatDistanceToNow(new Date(c.lastMessageTimestamp), { addSuffix: true })}
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          {selectedConv ? (
            <div className="h-full flex flex-col">
              <div className="p-4 font-semibold border-b">
                {selectedConv.name}
              </div>

              <ScrollArea className="flex-1 p-4">
                {selectedConv.messages.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No messages yet
                  </p>
                )}
              </ScrollArea>

              <TemplateReply
                templates={templates}
                onReply={sendMessage}
                isSending={sending}
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
