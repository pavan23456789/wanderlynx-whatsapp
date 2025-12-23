'use client';

import * as React from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  mockConversations,
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
  if (!status || status === 'pending') return null;
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

  const filtered = conversations
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => (filter === 'unread' ? (c.unread ?? 0) > 0 : true));
  
  const pinned = filtered.filter(c => c.pinned);
  const unpinned = filtered.filter(c => !c.pinned);


  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex-shrink-0 p-3 border-b">
         <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 rounded-full bg-secondary pl-9 focus-visible:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        <div className="mt-3 flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')} className="rounded-full h-8 flex-1">All</Button>
            <Button variant={filter === 'unread' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('unread')} className="rounded-full h-8 flex-1">Unread</Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
            {pinned.map((c) => (
                <ConversationRow key={c.id} conversation={c} selectedId={selectedId} onSelect={onSelect} />
            ))}
            {unpinned.map((c) => (
                <ConversationRow key={c.id} conversation={c} selectedId={selectedId} onSelect={onSelect} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConversationRow({ conversation, selectedId, onSelect }: { conversation: Conversation, selectedId: string | null, onSelect: (id: string) => void }) {
    const c = conversation;
    const isUnread = (c.unread ?? 0) > 0;
    return (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            'w-full border-b px-3 py-2.5 text-left transition-colors hover:bg-secondary',
            selectedId === c.id && 'bg-secondary'
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
              <AvatarImage src={c.avatar} />
              <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className={cn("truncate", isUnread ? "font-bold" : "font-semibold")}>
                    {c.name}
                </p>
                <p className={cn("text-xs", isUnread ? "text-primary font-medium" : "text-muted-foreground")}>
                  {formatFuzzyDate(c.lastMessageTimestamp)}
                </p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={cn("truncate text-sm", isUnread ? "text-foreground" : "text-muted-foreground")}>
                    {c.lastMessage}
                </p>
                {isUnread && (
                  <Badge className="h-5 w-5 justify-center rounded-full bg-primary p-0 text-primary-foreground">
                    {c.unread}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </button>
    )
}

function MessagePanel({ conversation }: { conversation: Conversation }) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'auto',
      });
    }
  }, [conversation.messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-4 border-b bg-card p-3">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
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
      >
        <div className="p-4 md:p-6 space-y-1">
          {conversation.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex items-end gap-2 text-sm',
                m.sender === 'me' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-lg px-3 py-2',
                  m.sender === 'me'
                    ? 'bg-green-100 text-foreground'
                    : 'bg-secondary text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                 <div className="mt-1 flex items-center justify-end gap-1.5">
                   <p className="text-xs text-muted-foreground/70">
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
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = React.useState('');

  const handleSend = () => {
      if (!text.trim()) return;
      onSend(text);
      setText('');
  };

  return (
    <div className="border-t bg-card p-3">
        <div className="relative flex items-center">
          <Input
            placeholder="Type a message..."
            className="rounded-full h-11 pr-12"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            suppressHydrationWarning
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
    </div>
  );
}

/* =================================================================
   MAIN INBOX PAGE
================================================================= */

export default function InboxPage() {
  const [conversations] = React.useState<Conversation[]>(mockConversations);
  const [selectedId, setSelectedId] = React.useState<string | null>('conv_1');
  const { toast } = useToast();

  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );

  const handleSend = (text: string) => {
    toast({
      title: 'Message Sent (Mock)',
      description: `Text: "${text}"`,
    });
  };
  
  if (conversations.length === 0) {
      return (
           <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-background">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No Conversations Yet</h3>
            <p className="mt-2 text-muted-foreground">
              When a customer sends you a message on WhatsApp, it will appear here.
            </p>
          </div>
      )
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch bg-background md:max-h-full"
    >
      <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[300px]">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={75}>
        {selectedConversation ? (
          <div className="flex h-full flex-col">
            <MessagePanel conversation={selectedConversation} />
            <ReplyBox onSend={handleSend} />
          </div>
        ) : (
           <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-background">
             <div className="text-center">
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
