'use client';

import * as React from 'react';
import {
  Send,
  MessageSquare,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  FileText,
  MoreVertical,
  Archive,
  Loader2,
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type {
  Template as TemplateType,
} from '@/lib/data';
import { mockAgents } from '@/lib/mock/mockAgents';
import { getCurrentUser, User } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// --- DATA TYPES ---
// These types now reflect the data coming from the API
export type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them'; // 'me' is outbound, 'them' is inbound
  time: string; // ISO 8601 string
};

export type Conversation = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unread: number;
  messages: Message[];
};


function TemplateDialog({
  open,
  onOpenChange,
  onSendTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendTemplate: (
    template: TemplateType,
    variables: Record<string, string>
  ) => void;
}) {
  const [templates, setTemplates] = React.useState<TemplateType[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateType | null>(null);
  const [variables, setVariables] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    if (open) {
      const fetchTemplates = async () => {
        const response = await fetch('/api/templates');
        if(response.ok) {
            const data = await response.json();
            setTemplates(data);
        }
      }
      fetchTemplates();
    }
  }, [open]);

  const variablePlaceholders = React.useMemo(() => {
    if (!selectedTemplate) return [];
    // Updated regex to find variables like {{1}}, {{2}}, etc.
    const regex = /\{\{(\d+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(selectedTemplate.content)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches).sort((a, b) => parseInt(a) - parseInt(b));
  }, [selectedTemplate]);

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = () => {
    if (selectedTemplate) {
      onSendTemplate(selectedTemplate, variables);
      onOpenChange(false);
      setSelectedTemplate(null);
      setVariables({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Template Message</DialogTitle>
          <DialogDescription>
            The 24-hour window is closed. You must send a template message to
            re-open the conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Message Template</Label>
            <Select
              onValueChange={(val) =>
                setSelectedTemplate(
                  templates.find((t) => t.name === val) || null
                )
              }
            >
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
          </div>
          {selectedTemplate && (
            <div className="space-y-4 rounded-2xl bg-secondary/50 p-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Template Preview</Label>
                <p className="whitespace-pre-wrap rounded-xl bg-background p-3 text-sm">
                  {selectedTemplate.content}
                </p>
              </div>
              {variablePlaceholders.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-muted-foreground">
                    Template Variables
                  </Label>
                  {variablePlaceholders.map((key) => (
                    <div key={key} className="space-y-2">
                      <Label
                        htmlFor={`var-${key}`}
                        className="font-mono text-sm"
                      >{`{{${key}}}`}</Label>
                      <Input
                        id={`var-${key}`}
                        value={variables[key] || ''}
                        onChange={(e) =>
                          handleVariableChange(key, e.target.value)
                        }
                        className="rounded-xl"
                        placeholder={`Enter value for variable ${key}`}
                        suppressHydrationWarning={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSend}
            className="rounded-full"
            size="lg"
            disabled={
              !selectedTemplate ||
              variablePlaceholders.length !== Object.keys(variables).length
            }
          >
            Send Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const formatFuzzyDate = (timestamp: string | number) => {
  const d = new Date(timestamp);
  if (isToday(d)) return format(d, 'p');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MM/dd/yy');
};

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col border-r bg-background p-3 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <Input
            placeholder="Search or start new chat"
            className="h-10 rounded-full pl-4"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex min-h-full w-full flex-col">
          {conversations.map((c) => (
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
  const isUnread = c.unread > 0;
  
  const previewText = c.lastMessage.length > 10 ? c.lastMessage.slice(0, 10) + "…" : c.lastMessage;
  const lastMessageIsOutbound = c.messages[c.messages.length - 1]?.sender === 'me';

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

      <div className="min-w-0 flex-1">
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
            <p className="font-bold text-foreground">{previewText}</p>
          ) : (
            <>
              {lastMessageIsOutbound && (
                <ReadStatus
                  status={'read'} // Mock, should come from data
                  className="mr-1 h-4 w-4 shrink-0"
                />
              )}
              <p className="break-all">{previewText}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex h-[42px] w-6 shrink-0 flex-col items-end justify-between pl-2 text-muted-foreground">
        {isUnread > 0 && (
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
  currentUser,
  onArchive,
}: {
  conversation: Conversation;
  currentUser: User | null;
  onArchive: (id: string) => void;
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex shrink-0 items-center gap-3 border-b bg-background p-2">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{conversation.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {conversation.phone}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Contact info</DropdownMenuItem>
              <DropdownMenuItem>Search</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mute notifications</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onArchive(conversation.id)}
                className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="w-full flex-1" viewportRef={scrollAreaRef}>
        <div className="space-y-1 p-4 md:p-6">
          {conversation.messages.map((m) => {
             // Internal notes are not supported by the API yet
             const isInternal = false;
             const agent = null; // Agent info isn't in message data yet
            if (isInternal) {
              return <InternalNote key={m.id} message={m} agent={agent} />;
            }
            return (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-2',
                  m.sender === 'me' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
                    m.sender === 'me' ? 'bg-green-100' : 'bg-background'
                  )}
                >
                  {m.sender === 'me' && agent && (
                     <div className="text-xs font-semibold text-gray-600 mb-1">
                        {agent.name} &bull; {agent.role === 'Super Admin' ? 'Admin' : 'Support'}
                     </div>
                  )}
                  <span className="block max-w-full overflow-hidden whitespace-pre-wrap break-all pr-16 text-sm md:text-base">
                    {m.text}
                  </span>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground/70">
                    <span suppressHydrationWarning>
                      {format(new Date(m.time), 'p')}
                    </span>
                    {m.sender === 'me' && (
                      <ReadStatus status={'read'} /> // Mock
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

function InternalNote({ message, agent }: { message: Message; agent: User | null | undefined }) {
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-yellow-100 p-3 text-center text-xs text-yellow-900">
        <div className="mb-1 flex items-center justify-center gap-2 font-semibold">
          <FileText className="h-3 w-3" />
          Internal note — {agent?.name || 'an agent'}
        </div>
        <p className="italic whitespace-pre-wrap break-all">{message.text}</p>
        <p className="mt-1 text-gray-500" suppressHydrationWarning>
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
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  className?: string;
}) => {
  if (!status || status === 'sent' || status === 'pending') {
    return <Check className={cn('inline h-4 w-4', className)} />;
  }
  if (status === 'delivered') {
    return <CheckCheck className={cn('inline h-4 w-4', className)} />;
  }
  if (status === 'read') {
    return (
      <CheckCheck className={cn('inline h-4 w-4 text-blue-500', className)} />
    );
  }
  return null;
};

function ReplyBox({
  onSend,
  onOpenTemplateDialog,
  disabled,
}: {
  onSend: (text: string) => void;
  onOpenTemplateDialog: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = React.useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    if (disabled) {
      onOpenTemplateDialog();
    } else {
      onSend(text);
    }
    setText('');
  };

  return (
    <div className="border-t bg-secondary/70 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder={
            disabled
              ? '24-hour window closed. Send template to continue.'
              : 'Type a message... (Templates only for now)'
          }
          className="h-11 flex-1 rounded-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          suppressHydrationWarning
          disabled // Free text is disabled for now, only templates
        />
        {disabled ? (
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
            disabled
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchConversations = React.useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedId]);
  
  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);
  
  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );
  
  const isWindowOpen = React.useMemo(() => {
    if (!selectedConversation?.lastMessageTimestamp) return false;
    const lastMsgTime = new Date(selectedConversation.lastMessageTimestamp);
    // Find the last INBOUND message to check the window
    const lastCustomerMessage = [...selectedConversation.messages].reverse().find(m => m.sender === 'them');
    if (!lastCustomerMessage) return false;
    
    const hoursSinceLastMessage = differenceInHours(
      new Date(),
      new Date(lastCustomerMessage.time)
    );
    return hoursSinceLastMessage < 24;
  }, [selectedConversation]);

  const handleSendTemplate = async (
    template: TemplateType,
    variables: Record<string, string>
  ) => {
    if (!selectedConversation) return;

    // The API expects variables as a simple array of strings in order.
    const sortedVarKeys = Object.keys(variables).sort((a, b) => parseInt(a) - parseInt(b));
    const params = sortedVarKeys.map(key => variables[key]);
    
    try {
      const response = await fetch('/api/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedConversation.id,
          templateName: template.name,
          params: params,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send template message');
      }
      toast({ title: "Message Sent", description: `Template "${template.name}" sent.` });
      fetchConversations(); // Re-fetch to show the new message
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // This function is no longer used for sending messages as free-text is disabled
  const handleSend = (text: string) => {};
  
  const handleSelectConversation = async (id: string) => {
    setSelectedId(id);
    // Fetch messages for the selected conversation
    try {
      const response = await fetch(`/api/conversations/messages?contactId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      setConversations(convs => convs.map(c => c.id === id ? { ...c, messages, unread: 0 } : c));
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleArchive = (id: string) => {
      // Archiving is a visual-only operation for now
      setConversations(convs => convs.filter(c => c.id !== id));
      if (selectedId === id) {
          const nextConversation = conversations.find(c => c.id !== id);
          setSelectedId(nextConversation?.id || null);
      }
  };

  if (!currentUser) {
    return <div className="flex h-full items-center justify-center"><Skeleton className="h-8 w-48" /></div>
  }

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] min-w-0 items-stretch bg-background md:max-h-full">
        <div className="h-full w-full max-w-sm flex-shrink-0 bg-background">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            isLoading={isLoading}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col h-full">
          {selectedConversation ? (
            <>
              <MessagePanel
                conversation={selectedConversation}
                currentUser={currentUser}
                onArchive={handleArchive}
              />
              <ReplyBox
                onSend={handleSend}
                disabled={!isWindowOpen}
                onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-background p-4 text-center">
              {isLoading ? <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" /> :
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">
                    Select a conversation
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Choose from an existing conversation to start chatting.
                  </p>
                </div>
              }
            </div>
          )}
        </div>
      </div>
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSendTemplate={handleSendTemplate}
      />
    </>
  );
}

    