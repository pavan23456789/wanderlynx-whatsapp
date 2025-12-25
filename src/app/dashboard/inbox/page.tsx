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
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  mockConversations as initialConversations,
  type Conversation,
  type Message,
  type Template as TemplateType,
  mockTemplates,
} from '@/lib/mock/mockInbox';
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

// --- HELPER TYPES ---
interface OutboundMessage extends Message {
  status?: 'sent' | 'delivered' | 'read';
}

function limitToThreeWords(text: string): string {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length > 3) {
    return words.slice(0, 3).join(' ') + '...';
  }
  return text;
}


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
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<TemplateType | null>(null);
  const [variables, setVariables] = React.useState<Record<string, string>>({});

  const variablePlaceholders = React.useMemo(() => {
    if (!selectedTemplate) return [];
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
                  mockTemplates.find((t) => t.id === val) || null
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select an approved template" />
              </SelectTrigger>
              <SelectContent>
                {mockTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
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
        <div className="flex w-full min-h-full flex-col">
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
  const isUnread = (c.unread ?? 0) > 0;
  const lastMessage = c.messages[c.messages.length - 1];
  const lastMessageIsOutbound = lastMessage?.type === 'outbound';
  const outboundStatus = lastMessageIsOutbound
    ? (lastMessage as OutboundMessage).status
    : undefined;
  
  const previewText = limitToThreeWords(c.lastMessage);

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
            <p className="font-bold text-foreground">
              {previewText}
            </p>
          ) : (
            <>
              {lastMessageIsOutbound && (
                <ReadStatus
                  status={outboundStatus}
                  className="mr-1 h-4 w-4 shrink-0"
                />
              )}
              <p className="truncate">{previewText}</p>
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-slate-50">
      <div className="flex shrink-0 items-center gap-3 border-b bg-background p-2">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{conversation.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {conversation.phone}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
              >
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Contact info</DropdownMenuItem>
              <DropdownMenuItem>Select messages</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mute notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear messages</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="flex-1 w-full" viewportRef={scrollAreaRef}>
        <div className="space-y-1 p-4 md:p-6">
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
                    'relative max-w-full rounded-lg px-3 py-2 shadow-sm',
                    m.type === 'outbound' ? 'bg-green-100' : 'bg-background'
                  )}
                >
                  <span className="block max-w-full overflow-hidden whitespace-pre-wrap break-all pr-16 text-sm md:text-base">
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
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder={
            disabled
              ? '24-hour window closed. Send template to continue.'
              : 'Type a message or /note for an internal note...'
          }
          className="h-11 flex-1 rounded-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          suppressHydrationWarning
        />
        {text.trim() || disabled ? (
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
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = React.useState(false);

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

  const handleSendTemplate = (
    template: TemplateType,
    variables: Record<string, string>
  ) => {
    let content = template.content;
    for (const key in variables) {
      content = content.replace(`{{${key}}}`, variables[key]);
    }
    handleSend(`TEMPLATE: ${template.name}\n${content}`);
  };

  const handleSend = (text: string) => {
    if (!selectedId || !currentUser) return;

    const newTimestamp = new Date().getTime();
    let newMessage: Message;

    if (text.startsWith('/note ')) {
      newMessage = {
        id: `msg_${newTimestamp}`,
        type: 'internal',
        agentId: currentUser.id,
        text: text.substring(6), // Remove '/note '
        time: new Date(newTimestamp).toISOString(),
      };
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
            lastMessage: isInternal ? c.lastMessage : text, // Keep old last msg on internal note
            lastMessageTimestamp: newTimestamp,
            lastAgentMessageAt: isInternal
              ? c.lastAgentMessageAt
              : newTimestamp,
            // When we send a message, the 24hr window re-opens
            isWindowOpen: true,
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
                m.id === newMessage.id ? { ...m, status: 'read' as const } : m
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

  const isReplyDisabled = !selectedConversation?.isWindowOpen;

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] items-stretch bg-background md:max-h-full">
        <div className="h-full w-full max-w-sm flex-shrink-0 bg-background">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
          />
        </div>
        <div className="flex-1 min-w-0 h-full flex flex-col">
          {selectedConversation ? (
            <>
              <MessagePanel conversation={selectedConversation} />
              <ReplyBox
                onSend={handleSend}
                disabled={isReplyDisabled}
                onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
              />
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
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSendTemplate={handleSendTemplate}
      />
    </>
  );
}
