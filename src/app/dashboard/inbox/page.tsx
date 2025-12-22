'use client';

import * as React from 'react';
import { RefreshCw, Send, AlertTriangle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* =========================
   TYPES
========================= */

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
  components: { text: string }[];
  status: string;
};

/* =========================
   TEMPLATE REPLY
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
  const [templateName, setTemplateName] = React.useState('');
  const [params, setParams] = React.useState<string[]>([]);

  React.useEffect(() => {
    const template = templates.find(t => t.name === templateName);
    if (!template) {
      setParams([]);
      return;
    }

    const text = template.components?.[0]?.text || '';
    const matches = text.match(/\{\{\d+\}\}/g) || [];
    setParams(Array(matches.length).fill(''));
  }, [templateName, templates]);

  return (
    <div className="p-4 space-y-3 border-t">
      <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-300 p-2 text-sm">
        <AlertTriangle className="h-4 w-4" />
        24-hour window closed. Use template message.
      </div>

      <Select value={templateName} onValueChange={setTemplateName}>
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

      {params.map((val, i) => (
        <Input
          key={i}
          placeholder={`Value for {{${i + 1}}}`}
          value={val}
          onChange={e => {
            const copy = [...params];
            copy[i] = e.target.value;
            setParams(copy);
          }}
        />
      ))}

      <Button
        className="w-full"
        disabled={!templateName || sending}
        onClick={() => onSend(templateName, params)}
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
      if (!res.ok) throw new Error('Failed to fetch conversations');

      const data = await res.json();
      setConversations(data);
      if (!selected && data.length) setSelected(data[0]);
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

  /* =========================
     FETCH TEMPLATES
  ========================= */

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    if (!res.ok) return;

    const data = await res.json();
    setTemplates(data.filter((t: Template) => t.status === 'APPROVED'));
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
      const res = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          template_name: templateName,
          variables: params,
        }),
      });

      if (!res.ok) throw new Error('Send failed');

      toast({
        title: 'Message sent',
        description: 'WhatsApp template sent successfully',
      });
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

  /* =========================
     RENDER
  ========================= */

  return (
    <TooltipProvider>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25}>
          <div className="p-4 space-y-3">
            <Button size="icon" onClick={fetchConversations}>
              <RefreshCw className={cn(loading && 'animate-spin')} />
            </Button>

            <ScrollArea className="h-full">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={cn(
                    'w-full p-3 rounded-md text-left hover:bg-secondary',
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
            <TemplateReply
              templates={templates}
              onSend={sendTemplate}
              sending={sending}
            />
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
