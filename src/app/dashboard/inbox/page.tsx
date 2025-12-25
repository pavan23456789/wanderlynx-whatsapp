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
  FileText,
  Pin,
  PinOff,
  Mail,
  Users,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

function AssignmentPopover({
  agents,
  assignedTo,
  onAssign,
  disabled,
  isBulk = false,
}: {
  agents: Agent[];
  assignedTo?: string | null | undefined;
  onAssign: (agentId: string | null) => void;
  disabled?: boolean;
  isBulk?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const assignedAgent = agents.find((a) => a.id === assignedTo);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {isBulk ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2"
            disabled={disabled}
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Assign</span>
          </Button>
        ) : (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Assign</span>
          </DropdownMenuItem>
        )}
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
                {!isBulk && assignedTo === agent.id && (
                  <Check className="h-4 w-4 ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        {assignedTo && !isBulk && (
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
  currentUser,
  selectedIds,
  onSelectId,
  onBulkAssign,
  onBulkPin,
  onBulkMarkRead,
  onTogglePin,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUser: User | null;
  selectedIds: string[];
  onSelectId: (id: string, checked: boolean) => void;
  onBulkAssign: (agentId: string | null) => void;
  onBulkPin: (pinned: boolean) => void;
  onBulkMarkRead: () => void;
  onTogglePin: (id: string) => void;
}) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const allFilteredConversations = React.useMemo(() => {
    return conversations
      .filter((c) => {
        if (search.trim() === '') return true;
        const searchTerm = search.toLowerCase();
        const inName = c.name.toLowerCase().includes(searchTerm);
        const inPhone = c.phone.toLowerCase().includes(searchTerm);
        const inMessages = c.messages.some((m) =>
          m.text.toLowerCase().includes(searchTerm)
        );
        return inName || inPhone || inMessages;
      })
      .filter((c) => {
        if (filter === 'unread') return (c.unread ?? 0) > 0;
        if (filter === 'me') return c.assignedTo === currentUser?.id;
        return true;
      });
  }, [conversations, search, filter, currentUser]);

  const handleSelectAll = (checked: boolean) => {
    allFilteredConversations.forEach((c) => onSelectId(c.id, checked));
  };

  const isAllSelected =
    allFilteredConversations.length > 0 &&
    allFilteredConversations.every((c) => selectedIds.includes(c.id));

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

        const currentIdx = allFilteredConversations.findIndex(
          (c) => c.id === selectedId
        );
        let nextIdx;

        if (e.key === 'ArrowDown') {
          nextIdx =
            currentIdx < allFilteredConversations.length - 1
              ? currentIdx + 1
              : 0;
        } else {
          // ArrowUp
          nextIdx =
            currentIdx > 0 ? currentIdx - 1 : allFilteredConversations.length - 1;
        }

        const nextConv = allFilteredConversations[nextIdx];
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
  }, [selectedId, allFilteredConversations, onSelect]);

  return (
    <div className="h-full flex flex-col bg-background min-w-0 overflow-hidden">
      <div className="flex-shrink-0 p-3 border-b border-r">
        {selectedIds.length > 0 ? (
          <div className="h-9 flex items-center justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                aria-label="Select all"
              />
              <label htmlFor="select-all" className="text-sm font-medium whitespace-nowrap">
                {selectedIds.length} <span className="hidden sm:inline">selected</span>
              </label>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-fade">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2"
                onClick={onBulkMarkRead}
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Read</span>
              </Button>
              <AssignmentPopover
                agents={mockAgents}
                onAssign={onBulkAssign}
                isBulk
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2"
                onClick={() => onBulkPin(true)}
              >
                <Pin className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Pin</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2"
                onClick={() => onBulkPin(false)}
              >
                <PinOff className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Unpin</span>
              </Button>
            </div>
          </div>
        ) : (
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
        )}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-full h-8 flex-1 min-w-[60px]"
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="rounded-full h-8 flex-1 min-w-[70px]"
          >
            Unread
          </Button>
          <Button
            variant={filter === 'me' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('me')}
            className="rounded-full h-8 flex-1 min-w-[100px] whitespace-nowrap"
          >
            Assigned to me
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 border-r w-full">
        <div className="flex min-h-full flex-col w-full">
          {allFilteredConversations.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              selectedId={selectedId}
              isSelected={selectedIds.includes(c.id)}
              onSelect={onSelect}
              onSelectId={onSelectId}
              onTogglePin={onTogglePin}
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
  isSelected,
  onSelect,
  onSelectId,
  onTogglePin,
}: {
  conversation: Conversation;
  selectedId: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSelectId: (id: string, checked: boolean) => void;
  onTogglePin: (id: string) => void;
}) {
  const c = conversation;
  const isUnread = (c.unread ?? 0) > 0;
  const isActive = selectedId === c.id;
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
        isActive && 'bg-secondary',
        isSelected && 'bg-primary/10'
      )}
    >
      <div className="flex shrink-0 items-center gap-3 pr-3 pt-1">
        <Checkbox
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            onSelectId(c.id, !isSelected);
          }}
          aria-label="Select conversation"
        />
        <Avatar className="h-10 w-10">
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
            <p className="truncate font-bold text-foreground">{c.lastMessage}</p>
          ) : (
            <>
              {lastMessageIsOutbound && (
                <ReadStatus
                  status={outboundStatus}
                  className="mr-1 h-4 w-4 shrink-0"
                />
              )}
              <p className="truncate">{c.lastMessage}</p>
            </>
          )}
        </div>
      </div>

      <div className="w-10 shrink-0 flex flex-col items-end justify-between text-muted-foreground pl-2 h-[42px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full data-[state=open]:bg-secondary -mr-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onTogglePin(c.id)}>
              {c.pinned ? (
                <PinOff className="mr-2 h-4 w-4" />
              ) : (
                <Pin className="mr-2 h-4 w-4" />
              )}
              <span>{c.pinned ? 'Unpin' : 'Pin'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              <span>Assign</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              <span>Mark as unread</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isUnread ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {c.unread}
          </div>
        ) : c.pinned ? (
          <Pin className="h-4 w-4 text-muted-foreground/70" />
        ) : lastMessageIsOutbound ? (
          <ReadStatus
            status={outboundStatus}
            className="h-4 w-4 text-muted-foreground/70"
          />
        ) : (
          <div className="h-5 w-5" />
        )}
      </div>
    </div>
  );
}

function MessagePanel({
  conversation,
  onAssign,
  disabled = false,
}: {
  conversation: Conversation;
  onAssign: (agentId: string | null) => void;
  disabled?: boolean;
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
  
  const assignedAgent = mockAgents.find((a) => a.id === conversation.assignedTo);

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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Search className="mr-2 h-4 w-4" />
              <span>Search in Conversation</span>
            </DropdownMenuItem>
            
            <AssignmentPopover
              agents={mockAgents}
              assignedTo={conversation.assignedTo}
              onAssign={onAssign}
              disabled={disabled}
            />

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>View Contact</span>
            </DropdownMenuItem>
             <DropdownMenuItem className="text-destructive">
              <span>Delete Conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
                  <span className="block break-all whitespace-pre-wrap pr-16 text-sm md:text-base">
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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setConversations((convs) => {
        const eligibleConvs = convs.filter((c) => c.id !== selectedId);
        if (eligibleConvs.length === 0) return convs;

        const convToUpdate =
          eligibleConvs[Math.floor(Math.random() * eligibleConvs.length)];
        const newTimestamp = new Date().getTime();
        const newMessage: Message = {
          id: `msg_${newTimestamp}`,
          type: 'inbound',
          text: 'This is a new incoming message!',
          time: new Date(newTimestamp).toISOString(),
        };

        return convs
          .map((c) =>
            c.id === convToUpdate.id
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  lastMessage: newMessage.text,
                  lastMessageTimestamp: newTimestamp,
                  unread: (c.unread || 0) + 1,
                  lastCustomerMessageAt: newTimestamp,
                }
              : c
          )
          .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.lastMessageTimestamp - a.lastMessageTimestamp;
          });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedId]);

  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );

  const handleSelectId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter((i) => i !== id);
      }
    });
  };

  const handleAssign = (agentId: string | null) => {
    if (!selectedId) return;
    setConversations((convs) =>
      convs.map((c) =>
        c.id === selectedId ? { ...c, assignedTo: agentId } : c
      )
    );
    const agentName = agentId
      ? mockAgents.find((a) => a.id === agentId)?.name
      : 'unassigned';
    toast({
      title: 'Conversation Assigned',
      description: `Assigned to ${agentName}.`,
    });
  };

  const handleBulkAssign = (agentId: string | null) => {
    setConversations((convs) =>
      convs.map((c) =>
        selectedIds.includes(c.id) ? { ...c, assignedTo: agentId } : c
      )
    );
    const agentName = agentId
      ? mockAgents.find((a) => a.id === agentId)?.name
      : 'unassigned';
    toast({
      title: 'Bulk Action',
      description: `${selectedIds.length} conversations assigned to ${agentName}.`,
    });
    setSelectedIds([]);
  };

  const handleBulkPin = (pinned: boolean) => {
    setConversations((convs) => {
      const newConvs = convs.map((c) =>
        selectedIds.includes(c.id) ? { ...c, pinned } : c
      );
      return newConvs.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.lastMessageTimestamp - a.lastMessageTimestamp;
      });
    });
    toast({
      title: 'Bulk Action',
      description: `${selectedIds.length} conversations ${
        pinned ? 'pinned' : 'unpinned'
      }.`,
    });
    setSelectedIds([]);
  };

  const handleTogglePin = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
  
    const newPinnedState = !conv.pinned;
    
    setConversations(currentConvs => 
      currentConvs
        .map(c => (c.id === id ? { ...c, pinned: newPinnedState } : c))
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.lastMessageTimestamp - a.lastMessageTimestamp;
        })
    );
    
    toast({
      title: 'Conversation Updated',
      description: `Conversation has been ${newPinnedState ? 'pinned' : 'unpinned'}.`,
    });
  };

  const handleBulkMarkRead = () => {
    setConversations((convs) =>
      convs.map((c) => (selectedIds.includes(c.id) ? { ...c, unread: 0 } : c))
    );
    toast({
      title: 'Bulk Action',
      description: `${selectedIds.length} conversations marked as read.`,
    });
    setSelectedIds([]);
  };

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
    setSelectedIds([]); // Clear bulk selection when a single conversation is selected
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
            currentUser={currentUser}
            selectedIds={selectedIds}
            onSelectId={handleSelectId}
            onBulkAssign={handleBulkAssign}
            onBulkPin={handleBulkPin}
            onBulkMarkRead={handleBulkMarkRead}
            onTogglePin={handleTogglePin}
        />
      </div>
      <div className="flex-1 min-w-0 h-full">
         <div className="flex h-full flex-col min-w-0">
          {selectedConversation ? (
            <>
              <MessagePanel
                conversation={selectedConversation}
                onAssign={handleAssign}
                disabled={!!isReadOnly}
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
