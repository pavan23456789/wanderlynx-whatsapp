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
  components: any[];
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
  const [selected, setSelected] = React.useState<Template | null>(null);
  const [params, setParams] = React.useState<string[]>([]);

  // count {{1}}, {{2}} etc from BODY
  React.useEffect(() => {
    if (!selected) return;

    const body = selected.components?.find(c => c.type === 'BODY');
    const matches = body?.text?.match(/\{\{\d+\}\}/g) || [];
    setParams(Array(matches.length).fill(''));
  }, [selected]);

  return (
    <div className="p-4 space-y-4 border-t">
      <div className="flex gap-2 rounded-xl border border-yellow-400 bg-yellow-50 p-3 text-yellow-900">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-medium">
          24-hour window closed. Use template message.
        </p>
      </div>

      <Select
        value={selected?.name}
        onValueChange={(name) =>
          setSelected(templates.find(t => t.name === name) || null)
        }
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
        disabled={!selected || sending}
        onClick={() => selected && onSend(selected.name, params)}
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

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data);
      setSelected(data[0] || null);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load conversations' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    if (res.ok) {
      const data = await res.json();
      setTemplates(data);
    }
  };

  React.useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  const sendTemplate = async (template: string, params: string[]) => {
    if (!selected) return;
    setSending(true);
    try {
      await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selected.phone,
          template_name: template,
          variables: params,
        }),
      });
      fetchConversations();
    } catch {
      toast({ variant: 'destructive', title: 'Send failed' });
    } finally {
      setSending(false);
    }
  };

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
                    'w-full p-3 text-left rounded-xl',
                    selected?.id === c.id && 'bg-secondary'
                  )}
                >
                  <div className="font-semibold">{c.name}</div>
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
          {selected && (
            <TemplateReply
              templates={templates}
              onSend={sendTemplate}
              sending={sending}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
