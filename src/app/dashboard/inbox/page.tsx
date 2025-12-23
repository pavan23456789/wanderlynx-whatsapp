'use client';

import * as React from 'react';
import {
  Send,
  Search,
  FileText,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  mockConversations,
  mockTemplates,
  type Conversation,
  type Message,
  type Template,
} from '@/lib/mock/mockInbox';

/* =================================================================
   UTILS
================================================================= */
const formatFuzzyDate = (date: Date | number) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'p');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MM/dd/yy');
};

/* =================================================================
   SUB-COMPONENTS
================================================================= */

/**
 * The left panel component displaying the list of conversations.
 */
function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = React.useState('');

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="rounded-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 p-2">
          {filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                'w-full rounded-xl p-3 text-left transition-colors hover:bg-secondary/50',
                selectedId === c.id && 'bg-secondary'
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 border" data-ai-hint="person portrait">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFuzzyDate(c.lastMessageTimestamp)}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {c.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-3 text-center text-xs text-muted-foreground">
        {conversations.length} conversations
      </div>
    </div>
  );
}

/**
 * The component for displaying messages in the selected conversation.
 */
function MessagePanel({ conversation }: { conversation: Conversation }) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation.messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border" data-ai-hint="person portrait">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{conversation.name}</p>
            <p className="text-sm text-muted-foreground">
              {conversation.phone}
            </p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4" viewportRef={scrollAreaRef}>
        <div className="space-y-4">
          {conversation.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex items-end gap-2',
                m.sender === 'me' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                  m.sender === 'me'
                    ? 'rounded-br-none bg-primary text-primary-foreground'
                    : 'rounded-bl-none bg-card'
                )}
              >
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * A component to handle replies. Switches between free-text and template-based input.
 */
function ReplyBox({
  isWindowOpen,
  templates,
  onSend,
}: {
  isWindowOpen: boolean;
  templates: Template[];
  onSend: (type: 'text' | 'template', value: string, params?: string[]) => void;
}) {
  const [text, setText] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [params, setParams] = React.useState<string[]>([]);
  const { toast } = useToast();

  const template = templates.find((t) => t.name === selectedTemplate);

  const paramCount = React.useMemo(() => {
    if (!template) return 0;
    const matches = template.content.match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
  }, [template]);

  React.useEffect(() => {
    setParams(Array(paramCount).fill(''));
  }, [paramCount]);

  const handleSend = () => {
    if (isWindowOpen) {
      if (!text.trim()) return;
      onSend('text', text);
      setText('');
    } else {
      if (!template) {
        toast({
          variant: 'destructive',
          title: 'No template selected',
          description: 'Please select a template to send a message.',
        });
        return;
      }
      if (params.some((p) => !p.trim())) {
        toast({
          variant: 'destructive',
          title: 'Missing variables',
          description: 'Please fill in all template variables.',
        });
        return;
      }
      onSend('template', template.name, params);
      setSelectedTemplate('');
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {isWindowOpen ? (
        <div className="relative">
          <Input
            placeholder="Type your message..."
            className="rounded-full py-6 pr-14"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            suppressHydrationWarning
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>
              The 24-hour customer service window is closed. You must reply
              with a template.
            </span>
          </div>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select an approved template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name} ({t.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {Array.from({ length: paramCount }).map((_, i) => (
            <Input
              key={i}
              placeholder={`Enter value for {{${i + 1}}}`}
              className="rounded-xl"
              value={params[i] || ''}
              onChange={(e) => {
                const newParams = [...params];
                newParams[i] = e.target.value;
                setParams(newParams);
              }}
              suppressHydrationWarning
            />
          ))}
          <Button
            className="w-full rounded-full"
            onClick={handleSend}
            disabled={!template || params.some((p) => !p.trim())}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Template Message
          </Button>
        </div>
      )}
    </div>
  );
}

/* =================================================================
   MAIN INBOX PAGE
================================================================= */

export default function InboxPage() {
  const [conversations] = React.useState<Conversation[]>(mockConversations);
  const [templates] = React.useState<Template[]>(mockTemplates);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );

  // In a real app, this would be a real API call. For now, it's a mock action.
  const handleSend = (
    type: 'text' | 'template',
    value: string,
    params?: string[]
  ) => {
    toast({
      title: 'Message Sent (Mock)',
      description:
        type === 'text'
          ? `Text: "${value}"`
          : `Template: ${value} with params: ${params?.join(', ')}`,
    });
    // Here, you would optimistically update the UI, but for mock data,
    // we'll just show the toast.
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch md:max-h-screen"
    >
      <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
        {conversations.length > 0 ? (
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-card">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Conversations Yet</h3>
            <p className="mt-2 text-muted-foreground">
              When a customer sends you a message on WhatsApp, it will appear
              here.
            </p>
          </div>
        )}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={75}>
        {selectedConversation ? (
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <MessagePanel conversation={selectedConversation} />
            </div>
            <ReplyBox
              isWindowOpen={selectedConversation.isWindowOpen}
              templates={templates}
              onSend={handleSend}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <div>
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">
                Select a Conversation
              </h3>
              <p className="mt-2 text-muted-foreground">
                Choose a conversation from the left panel to see the messages.
              </p>
            </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
