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
  Pin,
  Search,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  mockConversations,
  mockTemplates,
  type Conversation as ConversationType,
  type Message as MessageType,
  type Template as TemplateType,
} from '@/lib/mock/mockInbox';
import { mockAgents, Agent } from '@/lib/mock/mockAgents';
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
                  mockTemplates.find((t) => t.name === val) || null
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select an approved template" />
              </SelectTrigger>
              <SelectContent>
                {mockTemplates.map((t) => (
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
}: {
  conversations: ConversationType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="shrink-0 border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search or start new chat"
            className="h-10 rounded-full pl-9"
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
  conversation: ConversationType;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const c = conversation;
  const isUnread = c.unread && c.unread > 0;
  const assignedAgent = mockAgents.find((a) => a.id === c.assignedTo);
  const isOnline = assignedAgent && assignedAgent.id !== '3'; // Mock: Jane is offline

  const lastVisibleMessage = [...c.messages].reverse().find(m => m.type !== 'internal');
  
  const previewText = lastVisibleMessage?.text || c.lastMessage || '';
  const preview = previewText.length > 35 ? previewText.slice(0, 35) + '…' : previewText;

  return (
    <div
      data-conv-id={c.id}
      onClick={() => onSelect(c.id)}
      className={cn(
        'flex w-full cursor-pointer items-start border-b p-3',
        isActive && 'bg-secondary'
      )}
    >
      <div className="relative shrink-0 pt-1">
        <Avatar className="h-12 w-12">
          <AvatarImage src={c.avatar} />
          <AvatarFallback>{c.name[0]}</AvatarFallback>
        </Avatar>
        {assignedAgent && (
          <div className="absolute -bottom-1 -right-1">
            <Avatar className="h-5 w-5 border-2 border-background">
              <AvatarImage src={assignedAgent.avatar} />
              <AvatarFallback>{assignedAgent.name[0]}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-px -right-px block h-2 w-2 rounded-full border-2 border-background',
                isOnline ? 'bg-green-500' : 'bg-slate-400'
              )}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 pl-3">
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
            <p className="font-bold text-foreground">{preview}</p>
          ) : (
            <>
              {lastVisibleMessage?.type === 'outbound' && (
                <ReadStatus
                  status={lastVisibleMessage.status}
                  className="mr-1 h-4 w-4 shrink-0"
                />
              )}
              <p className="line-clamp-2">{preview}</p>
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
        {c.pinned && <Pin className="h-4 w-4 text-primary" />}
      </div>
    </div>
  );
}

function MessagePanel({
  conversation,
  currentUser,
}: {
  conversation: ConversationType;
  currentUser: User | null;
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
          <div className="flex items-center gap-2">
             <Badge variant={conversation.isWindowOpen ? 'default' : 'secondary'} className={cn(conversation.isWindowOpen ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600")}>Open</Badge>
             <p className="truncate text-sm text-muted-foreground">
                {conversation.phone}
             </p>
          </div>
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
              <DropdownMenuItem
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
            const agent = m.agentId
              ? mockAgents.find((a) => a.id === m.agentId)
              : null;
            if (m.type === 'internal') {
              return <InternalNote key={m.id} message={m} agent={agent} />;
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
                    'relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm',
                    m.type === 'outbound' ? 'bg-green-100' : 'bg-background'
                  )}
                >
                  {m.type === 'outbound' && agent && (
                     <div className="text-xs font-semibold text-gray-600 mb-1">
                        {agent.name} &bull; {mockAgents.find(a => a.id === agent.id)?.id === '1' ? 'Admin' : 'Support'}
                     </div>
                  )}
                  <span className="block max-w-full overflow-hidden whitespace-pre-wrap break-all pr-16 text-sm md:text-base">
                    {m.text}
                  </span>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 whitespace-nowrap text-[10px] text-muted-foreground/70">
                    <span suppressHydrationWarning>
                      {format(new Date(m.time), 'p')}
                    </span>
                    {m.type === 'outbound' && (
                      <ReadStatus status={m.status} />
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

function InternalNote({ message, agent }: { message: MessageType; agent: Agent | null | undefined }) {
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
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  className?: string;
}) => {
  if (!status || status === 'sent') {
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
  onSendInternalNote,
  onOpenTemplateDialog,
  isWindowOpen,
}: {
  onSend: (text: string) => void;
  onSendInternalNote: (text: string) => void;
  onOpenTemplateDialog: () => void;
  isWindowOpen: boolean;
}) {
  const [text, setText] = React.useState('');
  const [isInternal, setInternal] = React.useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    if (isInternal) {
      onSendInternalNote(text);
    } else {
      if (!isWindowOpen) {
        onOpenTemplateDialog();
      } else {
        onSend(text);
      }
    }
    setText('');
    setInternal(false);
  };

  const placeholderText = isInternal
    ? 'Type an internal note... (only visible to team)'
    : isWindowOpen
    ? 'Type a message...'
    : '24-hour window closed. Send template to continue.';

  return (
    <div className="border-t bg-secondary/70 p-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Input
          placeholder={placeholderText}
          className="h-11 flex-1 rounded-full"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          suppressHydrationWarning
          disabled={!isWindowOpen && !isInternal}
        />
        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleSend}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          variant={isInternal ? 'destructive' : 'ghost'}
          size="sm"
          className="rounded-full"
          onClick={() => setInternal(!isInternal)}
        >
          <FileText className="mr-2 h-4 w-4" />
          {isInternal ? 'Switch to Public Reply' : 'Add Internal Note'}
        </Button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [conversations, setConversations] =
    React.useState<ConversationType[]>(mockConversations);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    mockConversations[0]?.id || null
  );
  const [isTemplateDialogOpen, setTemplateDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );

  const handleSend = (text: string) => {
    if (!selectedId || !currentUser) return;
    const newMessage: MessageType = {
      id: `msg_${Date.now()}`,
      type: 'outbound',
      text,
      time: new Date().toISOString(),
      status: 'sent',
      agentId: currentUser.id,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: text,
              lastMessageTimestamp: new Date().getTime(),
            }
          : c
      )
    );
  };
  
  const handleSendInternalNote = (text: string) => {
    if (!selectedId || !currentUser) return;
    const newNote: MessageType = {
        id: `note_${Date.now()}`,
        type: 'internal',
        text,
        time: new Date().toISOString(),
        agentId: currentUser.id,
    };
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, newNote] } : c));
  }

  const handleSendTemplate = (
    template: TemplateType,
    variables: Record<string, string>
  ) => {
    if (!selectedId || !currentUser) return;
    let content = template.content;
    for (const key in variables) {
      content = content.replace(`{{${key}}}`, variables[key]);
    }

    const newMessage: MessageType = {
      id: `msg_${Date.now()}`,
      type: 'outbound',
      text: content,
      time: new Date().toISOString(),
      status: 'sent',
      agentId: currentUser.id,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: `Template: ${template.name}`,
              lastMessageTimestamp: new Date().getTime(),
              isWindowOpen: true, // Re-opens the window
            }
          : c
      )
    );
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] min-w-0 items-stretch bg-background md:max-h-full">
        <div className="h-full w-full max-w-sm flex-shrink-0 bg-background">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col h-full">
          {selectedConversation ? (
            <>
              <MessagePanel
                conversation={selectedConversation}
                currentUser={currentUser}
              />
              <ReplyBox
                onSend={handleSend}
                onSendInternalNote={handleSendInternalNote}
                isWindowOpen={selectedConversation.isWindowOpen}
                onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-background p-4 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">
                Select a conversation
              </h3>
              <p className="mt-2 text-muted-foreground">
                Choose from an existing conversation to start chatting.
              </p>
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
