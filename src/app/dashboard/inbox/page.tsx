'use client';

import * as React from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  FileText,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  mockConversations as initialConversations,
  type Conversation,
  type Message,
} from '@/lib/mock/mockInbox';
import { mockAgents, type Agent } from '@/lib/mock/mockAgents';
import { getCurrentUser, User } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';

// --- HELPER TYPES ---
interface OutboundMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
}

// --- COMPONENTS ---

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

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((c) => {
      if (search.trim() === '') return true;
      const searchTerm = search.toLowerCase();
      const inName = c.name.toLowerCase().includes(searchTerm);
      const inPhone = c.phone.toLowerCase().includes(searchTerm);
      return inName || inPhone;
    });
  }, [conversations, search]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        const currentIdx = filteredConversations.findIndex(
          (c) => c.id === selectedId
        );
        let nextIdx;

        if (e.key === 'ArrowDown') {
          nextIdx =
            currentIdx < filteredConversations.length - 1
              ? currentIdx + 1
              : 0;
        } else {
          // ArrowUp
          nextIdx =
            currentIdx > 0 ? currentIdx - 1 : filteredConversations.length - 1;
        }

        const nextConv = filteredConversations[nextIdx];
        if (nextConv) {
          onSelect(nextConv.id);
          const element = document.querySelector(
            `[data-conv-id="${nextConv.id}"]`
          );
          element?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' && selectedId) {
        onSelect(selectedId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, filteredConversations, onSelect]);

  return (
    <div className="h-full flex flex-col bg-background min-w-0 overflow-hidden">
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
      </div>
      <ScrollArea className="flex-1 border-r w-full">
        <div className="flex min-h-full flex-col w-full">
          {filteredConversations.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              isActive={selectedId === c.id}
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
  isActive,
  onSelect,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const c = conversation;
  const isUnread = (c.unread ?? 0) > 0;
  const lastMessage = c.messages[c.messages.length - 1];
  const lastMessageIsOutbound = lastMessage?.type === 'outbound';
  const outboundStatus = lastMessageIsOutbound
    ? (lastMessage as OutboundMessage).status
    : undefined;

  return (
    <div
      data-conv-id={c.id}
      onClick={() => onSelect(c.id)}
      className={cn(
        'flex w-full cursor-pointer items-start border-b p-3',
        isActive && 'bg-secondary'
      )}
    >
      <div className="flex shrink-0 items-center gap-3 pr-3 pt-1">
        <Avatar className="h-12 w-12">
          <AvatarImage src={c.avatar} />
          <AvatarFallback>{c.name[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <p className="truncate font-semibold">{c.name}</p>
          <span
            className="shrink-0 whitespace-nowrap pl-2 text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            {formatFuzzyDate(c.lastMessageTimestamp)}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          {isUnread ? (
            <p className="font-bold text-foreground line-clamp-2">{c.lastMessage}</p>
          ) : (
            <>
              {lastMessageIsOutbound && (
                <ReadStatus
                  status={outboundStatus}
                  className="mr-1 h-4 w-4 shrink-0"
                />
              )}
              <p className="line-clamp-2">{c.lastMessage}</p>
            </>
          )}
        </div>
      </div>

      <div className="w-6 shrink-0 flex flex-col items-end justify-between text-muted-foreground pl-2 h-[42px]">
        {isUnread && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {c.unread}
          </div>
        )}
      </div>
    </div>
  );
}

function MessagePanel({
  conversation,
}: {
  conversation: Conversation;
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
    <div className="h-full flex flex-col bg-slate-50 min-w-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-background p-2 shrink-0">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{conversation.name}</p>
          <p className="text-sm text-muted-foreground truncate">{conversation.phone}</p>
        </div>
      </div>
      <ScrollArea className="flex-1 w-full" viewportRef={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-1 w-full">
          {conversation.messages.map((m) => {
            if (m.type === 'internal') {
              return <InternalNote key={m.id} message={m} />;
            }
            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-2',
                  m.type === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm',
                    m.type === 'outbound' ? 'bg-green-100' : 'bg-background'
                  )}
                >
                  <span className="block break-words pr-16 text-sm md:text-base">
                    {m.text}
                  </span>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground/70">
                    <span suppressHydrationWarning>
                      {format(new Date(m.time), 'p')}
                    </span>
                    {m.type === 'outbound' && (
                      <ReadStatus status={(m as OutboundMessage).status} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function InternalNote({ message }: { message: Message }) {
  const agent = mockAgents.find((a) => a.id === message.agentId);
  return (
    <div className="flex items-center justify-center my-4">
      <div className="max-w-md w-full text-center text-xs text-muted-foreground bg-secondary/70 p-2 rounded-xl">
        <div className="font-semibold text-gray-600 mb-1 flex items-center justify-center gap-2">
          <FileText className="h-3 w-3" />
          Internal Note by {agent?.name || 'an agent'}
        </div>
        <p className="italic">{message.text}</p>
        <p className="mt-1 text-gray-400" suppressHydrationWarning>
          {format(new Date(message.time), 'Pp')}
        </p>
      </div>
    </div>
  );
}

const ReadStatus = ({
  status,
  className,
}: {
  status?: 'sent' | 'delivered' | 'read';
  className?: string;
}) => {
  if (!status || status === 'sent') {
    return <Check className={cn('h-4 w-4 inline', className)} />;
  }
  if (status === 'delivered') {
    return <CheckCheck className={cn('h-4 w-4 inline', className)} />;
  }
  if (status === 'read') {
    return (
      <CheckCheck className={cn('h-4 w-4 inline text-blue-500', className)} />
    );
  }
  return null;
};

function ReplyBox({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = React.useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="border-t bg-secondary/70 p-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder={
            disabled
              ? 'Assigned to another agent'
              : 'Type a message or /note for an internal note...'
          }
          className="rounded-full h-11 flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          suppressHydrationWarning
          disabled={disabled}
        />
        {text.trim() ? (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
            onClick={handleSend}
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const [conversations, setConversations] = React.useState<Conversation[]>(
    () => {
      return [...initialConversations].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      });
    }
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(
    conversations[0]?.id || null
  );
  
  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );

  const handleSend = (text: string) => {
    if (!selectedId || !currentUser) return;

    const newTimestamp = new Date().getTime();
    let newMessage: Message;
    let newLastMessage = text;

    if (text.startsWith('/note ')) {
      newMessage = {
        id: `msg_${newTimestamp}`,
        type: 'internal',
        agentId: currentUser.id,
        text: text.substring(6), // Remove '/note '
        time: new Date(newTimestamp).toISOString(),
      };
      newLastMessage = 'Internal note added'; // Don't show note content in convo list
    } else {
      newMessage = {
        id: `msg_${newTimestamp}`,
        type: 'outbound',
        text: text,
        time: new Date(newTimestamp).toISOString(),
        status: 'sent',
      } as OutboundMessage;
    }

    setConversations((convs) => {
      const newConvs = convs.map((c) => {
        if (c.id === selectedId) {
          const isInternal = newMessage.type === 'internal';
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: isInternal ? c.lastMessage : newLastMessage, // Keep old last msg on internal note
            lastMessageTimestamp: newTimestamp,
            lastAgentMessageAt: isInternal
              ? c.lastAgentMessageAt
              : newTimestamp,
          };
        }
        return c;
      });

      return newConvs.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      });
    });

    // Mock status updates only for actual messages
    if (newMessage.type === 'outbound') {
      setTimeout(() => {
        setConversations((convs) =>
          convs.map((c) => {
            if (c.id === selectedId) {
              const updatedMessages = c.messages.map((m) =>
                m.id === newMessage.id
                  ? { ...m, status: 'delivered' as const }
                  : m
              );
              return { ...c, messages: updatedMessages };
            }
            return c;
          })
        );
      }, 1000);
      setTimeout(() => {
        setConversations((convs) =>
          convs.map((c) => {
            if (c.id === selectedId) {
              const updatedMessages = c.messages.map((m) =>
                m.id === newMessage.id
                  ? { ...m, status: 'read' as const }
                  : m
              );
              return { ...c, messages: updatedMessages };
            }
            return c;
          })
        );
      }, 2500);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setConversations((convs) =>
      convs.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const isReadOnly =
    selectedConversation?.assignedTo &&
    selectedConversation.assignedTo !== currentUser?.id;

  return (
    <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch bg-background md:max-h-full">
      <div className="flex-shrink-0 w-96 bg-background h-full">
         <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
        />
      </div>
      <div className="flex-1 min-w-0 h-full">
         <div className="flex h-full flex-col min-w-0">
          {selectedConversation ? (
            <>
              <MessagePanel
                conversation={selectedConversation}
              />
              <ReplyBox onSend={handleSend} disabled={!!isReadOnly} />
            </>
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
        </div>
      </div>
    </div>
  );
}
