'use client';

import * as React from 'react';
import {
  Send,
  Search,
  FileText,
  AlertTriangle,
  MessageSquare,
  Check,
  CheckCheck,
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
import { Badge } from '@/components/ui/badge';
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

const ReadStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  if (status === 'sent') {
    return <Check className="h-4 w-4 text-muted-foreground" />;
  }
  return null;
};

/* =================================================================
   SUB-COMPONENTS
================================================================= */

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
  const [filter, setFilter] = React.useState('all');

  const filteredConversations = conversations
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => (filter === 'unread' ? (c.unread ?? 0) > 0 : true));

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="sticky top-0 z-10 border-b bg-card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat"
            className="rounded-full bg-secondary pl-10 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        <div className="mt-3 flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'secondary'} size="sm" onClick={() => setFilter('all')} className="rounded-full h-8 flex-1">All</Button>
            <Button variant={filter === 'unread' ? 'default' : 'secondary'} size="sm" onClick={() => setFilter('unread')} className="rounded-full h-8 flex-1">Unread</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                'w-full border-b px-4 py-3 text-left transition-colors hover:bg-secondary',
                selectedId === c.id && 'bg-secondary'
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border" data-ai-hint="person portrait">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-primary">
                      {formatFuzzyDate(c.lastMessageTimestamp)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                       {c.messages.length > 0 && <ReadStatus status={c.messages[c.messages.length - 1].status} />}
                      <p className="truncate">{c.lastMessage}</p>
                    </div>
                    {c.unread > 0 && (
                      <Badge className="h-5 w-5 justify-center rounded-full bg-primary p-0 text-primary-foreground">
                        {c.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessagePanel({ conversation }: { conversation: Conversation }) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'auto', // Use 'auto' for instant scrolling on load
      });
    }
  }, [conversation.messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-4 border-b bg-card p-3">
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
      <ScrollArea
        className="flex-1"
        viewportRef={scrollAreaRef}
        style={{ backgroundImage: 'url("https://i.imgur.com/pYmE3p3.png")', backgroundSize: '300px', backgroundRepeat: 'repeat' }}
      >
        <div className="p-4 md:p-6 space-y-2">
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
                  'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm',
                  m.sender === 'me'
                    ? 'bg-[#d9fdd3] text-foreground'
                    : 'bg-card text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1.5">
                   <p className="text-xs text-muted-foreground/80">
                       {format(new Date(m.time), 'p')}
                   </p>
                  {m.sender === 'me' && <ReadStatus status={m.status} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}


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
    <div className="border-t bg-secondary/70 p-3">
      {isWindowOpen ? (
        <div className="relative flex items-center">
          <Input
            placeholder="Type a message"
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
  };
  
  if (conversations.length === 0) {
      return (
           <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-card">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Conversations Yet</h3>
            <p className="mt-2 text-muted-foreground">
              When a customer sends you a message on WhatsApp, it will appear
              here.
            </p>
          </div>
      )
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch md:max-h-screen"
    >
      <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="max-w-[480px]">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={70}>
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
           <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-background" style={{ backgroundImage: 'url("https://i.imgur.com/pYmE3p3.png")', backgroundSize: '300px', backgroundRepeat: 'repeat' }}>
             <div className="text-center bg-card p-10 rounded-2xl shadow-sm">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">
                    Select a conversation
                </h3>
                <p className="mt-2 text-muted-foreground">
                    Choose from an existing conversation to start chatting.
                </p>
             </div>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
