'use client';

import * as React from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  UserPlus,
  MoreVertical,
  Paperclip,
  Mic,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { mockConversations as initialConversations, type Conversation, type Message } from '@/lib/mock/mockInbox';
import { mockAgents, type Agent } from '@/lib/mock/mockAgents';

// INBOX v1 LOCKED
// Conversation assignment approved by founder
// Do NOT extend UI beyond this scope
function AssignmentPopover({
  agents,
  assignedTo,
  onAssign,
}: {
  agents: Agent[];
  assignedTo: string | null | undefined;
  onAssign: (agentId: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const assignedAgent = agents.find((a) => a.id === assignedTo);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full flex-shrink-0"
        >
          {assignedAgent ? (
            <Avatar className="h-7 w-7" data-ai-hint="person portrait">
              <AvatarImage src={assignedAgent.avatar} />
              <AvatarFallback>{assignedAgent.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="p-2 font-semibold text-sm">Assign to...</div>
        <ScrollArea className="max-h-72">
          <div className="p-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  onAssign(agent.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-secondary"
              >
                <Avatar className="h-7 w-7" data-ai-hint="person portrait">
                  <AvatarImage src={agent.avatar} />
                  <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{agent.name}</span>
                {assignedTo === agent.id && (
                  <Check className="h-4 w-4 ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        {assignedTo && (
          <div className="border-t p-1">
            <button
              onClick={() => {
                onAssign(null);
                setOpen(false);
              }}
              className="w-full p-2 rounded-md text-left text-sm text-destructive hover:bg-destructive/10"
            >
              Unassign
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const formatFuzzyDate = (date: Date | number) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'p');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MM/dd/yy');
};

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

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);
  
  const allFilteredConversations = [...pinned, ...unpinned];


  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        
        const currentIdx = allFilteredConversations.findIndex(c => c.id === selectedId);
        let nextIdx;

        if (e.key === 'ArrowDown') {
          nextIdx = currentIdx < allFilteredConversations.length - 1 ? currentIdx + 1 : 0;
        } else { // ArrowUp
          nextIdx = currentIdx > 0 ? currentIdx - 1 : allFilteredConversations.length - 1;
        }
        
        const nextConv = allFilteredConversations[nextIdx];
        if (nextConv) {
          onSelect(nextConv.id);
          // Optional: scroll into view
          const element = document.querySelector(`[data-conv-id="${nextConv.id}"]`);
          element?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' && selectedId) {
        onSelect(selectedId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, allFilteredConversations, onSelect]);


  return (
    <div className="h-full flex flex-col bg-background">
        <div className="flex-shrink-0 p-3 border-b border-r">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    className="h-9 rounded-full bg-secondary pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    suppressHydrationWarning
                />
            </div>
             <div className="mt-3 flex gap-2">
                <Button
                    variant={filter === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="rounded-full h-8 flex-1"
                >
                    All
                </Button>
                <Button
                    variant={filter === 'unread' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="rounded-full h-8 flex-1"
                >
                    Unread
                </Button>
            </div>
        </div>
      <ScrollArea className="flex-1 border-r">
        <div className="flex flex-col">
          {pinned.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
          {unpinned.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ConversationRow({
  conversation,
  selectedId,
  onSelect,
}: {
  conversation: Conversation;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const c = conversation;
  const isUnread = (c.unread ?? 0) > 0;
  const isActive = selectedId === c.id;

  return (
    <button
      key={c.id}
      data-conv-id={c.id}
      onClick={() => onSelect(c.id)}
      className={cn(
        'w-full border-b px-3 py-2 text-left transition-colors hover:bg-secondary',
        isActive && 'bg-secondary'
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={c.avatar} />
          <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-baseline justify-between">
            <p
              className={cn(
                'truncate text-base',
                isUnread
                  ? 'font-semibold text-foreground'
                  : 'font-medium text-muted-foreground'
              )}
            >
              {c.name}
            </p>
            <p className="text-xs text-muted-foreground/80 shrink-0 whitespace-nowrap">
              {formatFuzzyDate(c.lastMessageTimestamp)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="truncate text-sm text-muted-foreground">
              {c.lastMessage}
            </p>
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function MessagePanel({
  conversation,
  onAssign,
}: {
  conversation: Conversation;
  onAssign: (agentId: string | null) => void;
}) {
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
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex items-center gap-3 border-b bg-background p-2">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{conversation.name}</p>
          <p className="text-sm text-muted-foreground">{conversation.phone}</p>
        </div>
        <AssignmentPopover
          agents={mockAgents}
          assignedTo={conversation.assignedTo}
          onAssign={onAssign}
        />
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
      <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-1">
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
                  'max-w-[75%] rounded-lg px-3 py-2 shadow-sm relative',
                  m.sender === 'me'
                    ? 'bg-green-100'
                    : 'bg-background'
                )}
              >
                  <span className="pr-16 break-words whitespace-pre-wrap">
                    {m.text}
                  </span>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 text-xs text-muted-foreground/70 whitespace-nowrap">
                    <span>{format(new Date(m.time), 'p')}</span>
                    {m.sender === 'me' && (
                      <ReadStatus status={(m as any).status} />
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

const ReadStatus = ({ status }: { status?: 'sent' | 'delivered' | 'read' }) => {
  if (!status || status === 'sent') {
    return <Check className="h-4 w-4 inline text-muted-foreground" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 inline text-muted-foreground" />;
  }
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 inline text-blue-500" />;
  }
  return null;
};

function ReplyBox({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = React.useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="border-t bg-secondary/70 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder="Type a message..."
          className="rounded-full h-11 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          suppressHydrationWarning
        />
        {text.trim() ? (
            <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
                onClick={handleSend}
            >
                <Send className="h-5 w-5" />
            </Button>
        ) : (
             <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
            >
                <Mic className="h-5 w-5" />
            </Button>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  // Local state to manage conversation data, including assignments
  const [conversations, setConversations] = React.useState<Conversation[]>(() => {
    const pinned = initialConversations.filter((c) => c.pinned);
    const unpinned = initialConversations.filter((c) => !c.pinned);
    return [...pinned, ...unpinned];
  });
  
  const [selectedId, setSelectedId] = React.useState<string | null>(conversations[0]?.id || null);
  const { toast } = useToast();

  React.useEffect(() => {
    // Mock receiving a message
    const interval = setInterval(() => {
      setConversations(convs => {
        const convToUpdate = convs[Math.floor(Math.random() * convs.length)];
        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender: 'them',
            text: 'This is a new message!',
            time: new Date().toISOString(),
          };
          
        return convs.map(c => 
          c.id === convToUpdate.id 
          ? { 
              ...c, 
              messages: [...c.messages, newMessage],
              lastMessage: newMessage.text,
              lastMessageTimestamp: new Date().getTime(),
              unread: (c.unread || 0) + 1
            } 
          : c
        );
      });
    }, 30000); // Receive a new message every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );
  
  const handleAssign = (agentId: string | null) => {
    if (!selectedId) return;
    setConversations(convs => convs.map(c => 
      c.id === selectedId ? { ...c, assignedTo: agentId } : c
    ));
    const agentName = agentId ? mockAgents.find(a => a.id === agentId)?.name : 'unassigned';
     toast({
      title: 'Conversation Assigned',
      description: `Assigned to ${agentName}.`,
    });
  };

  const handleSend = (text: string) => {
     if (!selectedId) return;

    const newMessage: Message & { status: 'sent' | 'delivered' | 'read' } = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text: text,
      time: new Date().toISOString(),
      status: 'sent'
    };

    setConversations(convs => {
      const newConvs = convs.map(c => {
        if (c.id === selectedId) {
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: text,
            lastMessageTimestamp: new Date().getTime(),
          };
        }
        return c;
      });

      // Move the updated conversation to the top of the unpinned list
      const updatedConv = newConvs.find(c => c.id === selectedId);
      if (updatedConv && !updatedConv.pinned) {
        const otherConvs = newConvs.filter(c => c.id !== selectedId);
        const pinnedConvs = otherConvs.filter(c => c.pinned);
        const unpinnedConvs = otherConvs.filter(c => !c.pinned);
        return [...pinnedConvs, updatedConv, ...unpinnedConvs];
      }
      return newConvs;
    });
    
    // Mock status updates
    setTimeout(() => {
      setConversations(convs => convs.map(c => {
        if (c.id === selectedId) {
          const updatedMessages = c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m);
          return { ...c, messages: updatedMessages };
        }
        return c;
      }));
    }, 1000);
     setTimeout(() => {
      setConversations(convs => convs.map(c => {
        if (c.id === selectedId) {
          const updatedMessages = c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' as const } : m);
          return { ...c, messages: updatedMessages };
        }
        return c;
      }));
    }, 2500);

  };

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    // Mark as read
    setConversations(convs => convs.map(c => 
      c.id === id ? { ...c, unread: 0 } : c
    ));
  };


  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch bg-background md:max-h-full"
    >
      <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="min-w-[320px]">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={75}>
        {selectedConversation ? (
          <div className="h-full flex flex-col">
            <MessagePanel
              conversation={selectedConversation}
              onAssign={handleAssign}
            />
            <ReplyBox onSend={handleSend} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center bg-background">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Select a conversation</h3>
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
