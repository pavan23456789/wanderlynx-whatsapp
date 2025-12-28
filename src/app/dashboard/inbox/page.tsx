'use client';
// 🔒 INBOX & CHAT FREEZE - FULL PRODUCTION VERSION
// Features: Realtime, Internal Notes, Template Button, Role Access.

import * as React from 'react';
import {
  Send,
  MessageSquare,
  Paperclip,
  FileText,
  Archive,
  Pin,
  Search,
  AlertTriangle,
  MoreVertical,
  Lock,
  Undo2,
  Loader,
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInHours, isSameDay } from 'date-fns';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type Template as TemplateType } from '@/lib/data';
import { User, getCurrentUser } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js'; // ✅ Import Supabase Client
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// --- SUPABASE CLIENT ---
// ✅ FIX 1: Initialize Realtime Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TYPES ---

type Message = {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string; // ISO 8601 string
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  agentId?: string;
  type: 'inbound' | 'outbound' | 'internal'; // Strict union
};

type Agent = {
  id: string;
  name: string;
  avatar: string;
  role: 'Super Admin' | 'Internal Staff';
};

type Conversation = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTimestamp: number;
  isWindowOpen: boolean;
  messages: Message[];
  assignedTo?: string | null;
  pinned: boolean; 
  unread: number;  
  state: 'Open' | 'Pending' | 'Resolved';
};

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Super Admin',
    avatar: 'https://picsum.photos/seed/8/80/80',
    role: 'Super Admin',
  },
  {
    id: '2',
    name: 'John Doe',
    avatar: 'https://picsum.photos/seed/9/40/40',
    role: 'Internal Staff',
  },
  {
    id: '3',
    name: 'Jane Appleseed',
    avatar: 'https://picsum.photos/seed/10/40/40',
    role: 'Internal Staff',
  },
];

// --- NORMALIZATION HELPER ---
const normalizeConversation = (apiData: any): Conversation => {
  // 1. Normalize Messages with Strict Types
  const messages: Message[] = Array.isArray(apiData.messages)
    ? apiData.messages.map((m: any) => {
        // Determine Type strictly
        let msgType: 'inbound' | 'outbound' | 'internal' = 'internal'; 
        if (m.type === 'internal') msgType = 'internal';
        else if (m.direction === 'inbound') msgType = 'inbound';
        else if (m.direction === 'outbound') msgType = 'outbound';
        
        // Determine Sender
        const sender = m.direction === 'inbound' ? 'them' : 'me';

        return {
          id: m.id,
          sender: sender,
          // ✅ FIX 2: Check BOTH 'content' (new DB) and 'body' (old DB)
          text: m.content || m.body || '', 
          time: m.created_at || new Date().toISOString(),
          status: m.status ?? 'sent', // Safe default
          agentId: m.agentId,
          type: msgType, 
        };
      })
    : [];

  // 2. Derive computed fields safely
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const lastTimestamp = lastMsg ? new Date(lastMsg.time).getTime() : Date.now();
  
  // Find last CUSTOMER message for window logic
  const lastCustomerMessage = [...messages].reverse().find(m => m.sender === 'them' && m.type !== 'internal');
  
  // Hardened Date Check (Prevents crash on garbage date)
  let isWindowOpen = false;
  if (lastCustomerMessage) {
      const msgDate = new Date(lastCustomerMessage.time);
      if (!isNaN(msgDate.getTime())) {
          isWindowOpen = differenceInHours(new Date(), msgDate) < 24;
      }
  }

  // 3. Map State/Status
  let uiState: Conversation['state'] = 'Open';
  if (apiData.status === 'closed') uiState = 'Resolved';
  else if (apiData.status === 'pending') uiState = 'Pending';

  // 4. Handle assignedTo variants
  let assignedToId = null;
  if (typeof apiData.assignedTo === 'string') assignedToId = apiData.assignedTo;
  else if (apiData.assignedTo && typeof apiData.assignedTo === 'object') assignedToId = apiData.assignedTo.id;

  return {
    id: apiData.id,
    name: apiData.name || apiData.phone || 'Unknown Contact',
    phone: apiData.phone || '',
    avatar: apiData.avatar || `https://ui-avatars.com/api/?name=${apiData.name || 'U'}&background=random`,
    messages: messages,
    lastMessage: lastMsg?.text || '',
    lastMessageTimestamp: lastTimestamp,
    isWindowOpen: isWindowOpen,
    assignedTo: assignedToId,
    pinned: !!apiData.pinned,
    unread: typeof apiData.unread === 'number' ? apiData.unread : 0,
    state: uiState,
  };
};

// --- COMPONENTS ---

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  let label = format(d, 'MMMM d, yyyy');
  if (isToday(d)) label = 'Today';
  if (isYesterday(d)) label = 'Yesterday';

  return (
    <div className="sticky top-0 z-10 my-4 flex justify-center">
      <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
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
    const [templates, setTemplates] = React.useState<TemplateType[]>([]);
  
    React.useEffect(() => {
      async function fetchTemplates() {
        if(open) {
          try {
              const res = await fetch('/api/templates');
              if(res.ok) {
                  const data = await res.json();
                  setTemplates(data);
              }
          } catch(e) { console.error("Failed to fetch templates", e); }
        }
      }
      fetchTemplates();
    }, [open]);
  
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
        {/* ✅ FIX: Added 'max-h-[85vh]', 'flex-col', and 'overflow-hidden'
           This ensures the dialog never exceeds 85% of screen height.
        */}
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* Header (Fixed at Top) */}
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle>Send Template Message</DialogTitle>
            <DialogDescription>
              The 24-hour window is closed. You must send a template message to
              re-open the conversation.
            </DialogDescription>
          </DialogHeader>
  
          {/* ✅ FIX: Added 'overflow-y-auto' and 'flex-1'
             This makes the middle section scrollable if content is too long.
          */}
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="grid gap-6">
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
          </div>
  
          {/* Footer (Fixed at Bottom) */}
          <DialogFooter className="p-6 pt-2 border-t bg-background shrink-0">
            <Button
              onClick={handleSend}
              className="rounded-full w-full sm:w-auto"
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
const formatFuzzyDate = (timestamp: string | number | null | undefined) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'p');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MM/dd/yy');
};

const stateConfig = {
  Open: { className: 'bg-green-100 text-green-800' },
  Pending: { className: 'bg-yellow-100 text-yellow-800' },
  Resolved: { className: 'bg-gray-200 text-gray-800' },
} as const;

type FilterState = 'All' | 'Open' | 'Pending' | 'Resolved';

function ConversationList({
  conversations,
  selectedId,
  onSelect,
  activeFilter,
  onSetFilter,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeFilter: FilterState;
  onSetFilter: (filter: FilterState) => void;
}) {
  const filters: FilterState[] = ['All', 'Open', 'Pending', 'Resolved'];

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
        <div className="mt-3 flex gap-1">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => onSetFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex min-h-full w-full flex-col">
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                isActive={selectedId === c.id}
                onSelect={onSelect}
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              No conversations match the current filter.
            </div>
          )}
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
  const isUnread = c.unread && c.unread > 0;
  const assignedAgent = mockAgents.find((a) => a.id === c.assignedTo);
  const isOnline = assignedAgent?.name !== 'Jane Appleseed'; 

  const lastVisibleMessage = [...c.messages].reverse().find(m => m.type !== 'internal');
  
  const rawPreviewText = lastVisibleMessage?.text || c.lastMessage || '';
  
  const previewText = rawPreviewText.length > 100 ? `${rawPreviewText.slice(0, 100)}…` : rawPreviewText;


  const StateBadge = stateConfig[c.state];

  return (
    <div
      data-conv-id={c.id}
      onClick={() => onSelect(c.id)}
      className={cn(
        'w-full cursor-pointer border-b p-3',
        isActive ? 'bg-accent' : 'hover:bg-accent/50'
      )}
    >
      <div className="flex w-full items-start">
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
              <p className="font-bold text-foreground truncate">{previewText}</p>
            ) : (
              <p className="truncate">{previewText}</p>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={cn('text-xs font-bold', StateBadge.className)}>{c.state}</Badge>
            {c.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
          </div>
        </div>

        {c.unread !== undefined && c.unread > 0 && (
          <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
  onSetConversationState,
  onSendMessage,
  onRetryMessage,
}: {
  conversation: Conversation;
  currentUser: User | null;
  onSetConversationState: (id: string, state: Conversation['state']) => void;
  onSendMessage: (text: string, type: 'outbound' | 'internal', templateName?: string, templateVars?: string[]) => void;
  onRetryMessage: (messageId: string) => void;
}) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = React.useState(false);


  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'auto',
      });
    }
  }, [conversation.messages]);

  const assignedAgent = mockAgents.find(a => a.id === conversation.assignedTo);
  const isResolved = conversation.state === 'Resolved';
  const canReopen = currentUser?.role === 'Super Admin';
  const isWindowOpen = conversation.isWindowOpen;

  const handleSendTemplate = (template: TemplateType, variables: Record<string, string>) => {
        const params = Object.values(variables);
        onSendMessage(template.content, 'outbound', template.name, params);
  };

  const ResolveButton = () => (
    <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={() => onSetConversationState(conversation.id, 'Resolved')}
    >
        <Archive className="h-5 w-5" />
        <span className="sr-only">Mark as Resolved</span>
    </Button>
  );

  const ReopenButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => canReopen && onSetConversationState(conversation.id, 'Open')}
                  disabled={!canReopen}
              >
                  <Undo2 className="h-5 w-5" />
                  <span className="sr-only">Reopen Conversation</span>
              </Button>
            </div>
        </TooltipTrigger>
        {!canReopen && <TooltipContent><p>Only Admins can reopen conversations.</p></TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );


  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b bg-card p-2">
        <Avatar className="h-9 w-9 border" data-ai-hint="person portrait">
          <AvatarImage src={conversation.avatar} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{conversation.name}</p>
          <div className="flex items-center gap-2">
             <Badge variant={isWindowOpen ? 'default' : 'secondary'} className={cn('font-bold', isWindowOpen ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600")}>
                {isWindowOpen ? 'Window Open' : 'Window Closed'}
             </Badge>
             <p className="truncate text-sm text-muted-foreground">
                {conversation.phone}
             </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isResolved ? <ReopenButton /> : <ResolveButton />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Contact info</DropdownMenuItem>
              <DropdownMenuItem>Search</DropdownMenuItem>
              <DropdownMenuSeparator />
               {isResolved ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <div>
                             <DropdownMenuItem disabled={!canReopen} onClick={() => canReopen && onSetConversationState(conversation.id, 'Open')}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                <span>Reopen Conversation</span>
                             </DropdownMenuItem>
                           </div>
                        </TooltipTrigger>
                        {!canReopen && <TooltipContent><p>Only Admins can reopen.</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
               ) : (
                 <DropdownMenuItem 
                   className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
                   onClick={() => onSetConversationState(conversation.id, 'Resolved')}
                 >
                   <Archive className="mr-2 h-4 w-4" />
                   <span>Mark as Resolved</span>
                 </DropdownMenuItem>
               )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="w-full flex-1 min-h-0">
          <ScrollArea className="h-full" viewportRef={scrollAreaRef}>
            <div className="space-y-1 p-4 md:p-6">
              {currentUser?.role === 'Marketing' && (
                <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 mb-4">
                  <Lock className="h-4 w-4 !text-blue-800" />
                  <AlertTitle>Read-only Access</AlertTitle>
                  <AlertDescription>
                    Your role has read-only access to the inbox. You can view conversations but cannot reply.
                  </AlertDescription>
                </Alert>
              )}
              {/* Message Loop */}
              {conversation.messages.map((m, index) => {
                const prevMessage = conversation.messages[index - 1];
                const isNewDay = !prevMessage || !isSameDay(new Date(m.time), new Date(prevMessage.time));

                const agent = m.agentId
                  ? mockAgents.find((a) => a.id === m.agentId)
                  : null;

                return (
                  <React.Fragment key={m.id}>
                    {isNewDay && <DateSeparator date={m.time} />}
                    
                    {m.type === 'internal' ? (
                       <InternalNote message={m} agent={agent} />
                    ) : (
                       <MessageBubble 
                          message={m} 
                          agent={agent} 
                          assignedToId={conversation.assignedTo} 
                          onRetry={() => onRetryMessage(m.id)}
                       />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </ScrollArea>
      </div>
       {currentUser?.role !== 'Marketing' && (
         <ReplyBox
           onSend={(text) => onSendMessage(text, 'outbound')}
           onSendInternalNote={(text) => onSendMessage(text, 'internal')}
           onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
           isWindowOpen={isWindowOpen}
           isResolved={isResolved}
           assignedAgent={assignedAgent}
           currentUser={currentUser}
        />
       )}
       <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSendTemplate={handleSendTemplate}
      />
    </div>
  );
}

function MessageBubble({
  message,
  agent,
  assignedToId,
  onRetry,
}: {
  message: Message;
  agent: Agent | null | undefined;
  assignedToId?: string | null;
  onRetry: () => void;
}) {
  const isOutbound = message.sender === 'me';
  const isUnassignedReply = isOutbound && agent && agent.id !== assignedToId;

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        isOutbound ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'relative w-fit min-w-0 max-w-[75%] rounded-2xl px-3 py-2 shadow-sm',
          isOutbound ? 'bg-secondary' : 'bg-[#E3F2FD]'
        )}
      >
        {isOutbound && agent && isUnassignedReply && (
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600">
            Sent by {agent.name}
          </div>
        )}
        <p className="min-w-0 whitespace-pre-wrap break-all">
          {message.text}
        </p>
      </div>
       <div className="mt-1 flex items-center justify-end gap-1.5 whitespace-nowrap px-1 text-[11px] text-muted-foreground/80">
        {message.status === 'failed' && (
            <>
              <span className="font-semibold text-red-500">Failed</span>
              <Button variant="link" size="sm" className="h-auto p-0 text-[11px] text-blue-500" onClick={onRetry}>Retry</Button>
              <span className="mx-1">•</span>
            </>
        )}
        <span suppressHydrationWarning>
        {isNaN(new Date(message.time).getTime()) ? '' : format(new Date(message.time), 'p')}
        </span>
      </div>
    </div>
  );
}


function InternalNote({ message, agent }: { message: Message; agent: Agent | null | undefined }) {
  if (!agent) return null;
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-yellow-100/80 p-3 text-center text-xs text-yellow-900 border border-yellow-200">
        <div className="mb-1 flex items-center justify-center gap-2 font-semibold">
            Internal Note • {agent.name}
        </div>
        <p className="italic whitespace-pre-wrap break-all">{message.text}</p>
        <p className="mt-1 text-gray-500" suppressHydrationWarning>
        {isNaN(new Date(message.time).getTime()) ? '' : format(new Date(message.time), 'Pp')}
        </p>
      </div>
    </div>
  );
}

// ✅ FIX 3: REPLY BOX WITH BUTTON
function ReplyBox({
  onSend,
  onSendInternalNote,
  onOpenTemplateDialog,
  isWindowOpen,
  isResolved,
  assignedAgent,
  currentUser,
}: {
  onSend: (text: string) => void;
  onSendInternalNote: (text: string) => void;
  onOpenTemplateDialog: () => void;
  isWindowOpen: boolean;
  isResolved: boolean;
  assignedAgent: Agent | null | undefined;
  currentUser: User | null;
}) {
  const [text, setText] = React.useState('');
  const [isInternal, setInternal] = React.useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    if (isInternal) {
      onSendInternalNote(text);
    } else {
      onSend(text);
    }
    setText('');
    setInternal(false);
  };

  const placeholderText = isInternal
    ? 'Type an internal note... (only visible to team)'
    : isWindowOpen
    ? 'Type a message...'
    : '24-hour window closed. Send template to continue.';

  const getFooterLabel = () => {
    if (isResolved && !isInternal) {
        return <span className="font-semibold text-yellow-600">This conversation is resolved. Sending a message will reopen it.</span>
    }
    if (currentUser?.id === assignedAgent?.id) return null;
    
    if (assignedAgent) {
        return <span className="font-semibold text-orange-600">Assigned to {assignedAgent.name}</span>
    }
    return <span className="font-semibold text-gray-600">Unassigned Conversation</span>
  };

  const footerLabel = getFooterLabel();

  return (
    <div className="border-t bg-secondary/70 p-3">
       {footerLabel && (
           <div className="text-xs px-2 pb-1.5 flex items-center gap-2">
             {isResolved && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
             {footerLabel}
           </div>
       )}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onOpenTemplateDialog}>
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* ✅ THE FIX: Button Logic */}
        {(!isWindowOpen && !isInternal) ? (
            <Button 
                variant="outline" 
                className="h-11 flex-1 rounded-full justify-start text-muted-foreground font-normal border-dashed border-2 hover:bg-white"
                onClick={onOpenTemplateDialog}
            >
                <span className="mr-2">🔒</span> Window Closed. Click here to send a Template...
            </Button>
        ) : (
            <Input
              placeholder={placeholderText}
              className="h-11 flex-1 rounded-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
              }}
              suppressHydrationWarning
              disabled={!isWindowOpen && !isInternal}
            />
        )}

        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleSend}
          disabled={!isInternal && !isWindowOpen}
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

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;


export default function InboxPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<FilterState>('All');
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  
  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const fetchConversations = React.useCallback(async () => {
    if (conversations.length === 0) setIsLoading(true);
    try {
        const res = await fetch('/api/conversations');
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const raw = await res.json();
        const rawList = Array.isArray(raw?.conversations) ? raw.conversations : [];

        // ✅ Normalization
        const normalizedList = rawList.map(normalizeConversation);
        setConversations(normalizedList);

        if (!selectedId && normalizedList.length > 0) {
          setSelectedId(normalizedList[0].id);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast, selectedId]); 

  // ✅ FIX 2: SUPABASE REALTIME SUBSCRIPTION
  React.useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
           console.log('[Realtime] New message detected. Refreshing...');
           fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
           console.log('[Realtime] Conversation updated. Refreshing...');
           fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  const filteredConversations = React.useMemo(() => {
    const sorted = [...conversations].sort(
      (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.lastMessageTimestamp - a.lastMessageTimestamp
    );
    if (activeFilter === 'All') return sorted;
    return sorted.filter((c) => c.state === activeFilter);
  }, [conversations, activeFilter]);

  React.useEffect(() => {
    if (selectedId && !filteredConversations.find(c => c.id === selectedId)) {
        setSelectedId(null);
    }
    else if (!selectedId && filteredConversations.length > 0) {
        setSelectedId(filteredConversations[0].id);
    }
  }, [selectedId, filteredConversations]);
  
  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId);
    setConversations(prev =>
        prev.map(c => 
            c.id === conversationId ? { ...c, unread: 0 } : c
        )
    );
  };

  const handleSetConversationState = async (conversationId: string, state: Conversation['state']) => {
    // Optimistic Update
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, state: state } : c
      )
    );
    // Sync with Backend
    try {
        const apiStatus = state === 'Resolved' ? 'closed' : 'open';
        const res = await fetch(`/api/conversations/${conversationId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: apiStatus })
        });
        if (!res.ok) throw new Error("Failed to sync state");
    } catch(e) {
        console.error("State sync failed", e);
        toast({ variant: 'destructive', title: 'Sync Error', description: 'Could not update conversation status on server.' });
    }
  };
  
  const handleSendMessage = async (text: string, type: 'outbound' | 'internal', templateName?: string, templateVars?: string[]) => {
    if (!selectedId || !currentUser || !text.trim()) return;
    if (currentUser.role === 'Marketing') return;

    const optimisticId = `msg_${Date.now()}`;
    
    // STRICT TYPE for optimistic message
    const newMessage: Message = {
        id: optimisticId,
        type: type, 
        sender: 'me',
        text,
        time: new Date().toISOString(),
        agentId: currentUser.id,
        status: 'sent',
    };
    
    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedId) {
            const isResolved = c.state === 'Resolved';
            const newState = (isResolved && type !== 'internal') ? 'Open' : c.state;
            return { 
                ...c, 
                messages: [...c.messages, newMessage],
                lastMessage: type !== 'internal' ? text : c.lastMessage,
                lastMessageTimestamp: new Date().getTime(),
                state: newState,
                 ...(type !== 'internal' && { unread: 0 }),
            };
        }
        return c;
      })
    );
    
    // API call
    try {
      const isWindowOpen = conversations.find(c => c.id === selectedId)?.isWindowOpen ?? false;
      const endpoint = '/api/messages/send';
      const body = isWindowOpen 
        ? { contactId: selectedId, text } 
        : { contactId: selectedId, templateName, params: templateVars };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      // Update message status on success
       setConversations(prev =>
         prev.map(c => {
           if (c.id === selectedId) {
             return {
               ...c,
               messages: c.messages.map(m => m.id === optimisticId ? {...m, status: 'sent'} : m)
             }
           }
           return c;
         })
       );
       fetchConversations(); 

    } catch (error) {
       // Revert optimistic update
       setConversations(prev =>
         prev.map(c => {
           if (c.id === selectedId) {
             return {
               ...c,
               messages: c.messages.map(m => m.id === optimisticId ? {...m, status: 'failed'} : m)
             }
           }
           return c;
         })
       );
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    }
  };

  const handleRetryMessage = (messageId: string) => {
    if (!selectedId) return;
    const conversation = conversations.find(c => c.id === selectedId);
    if (!conversation) return;
    const messageToRetry = conversation.messages.find(m => m.id === messageId);
    if (!messageToRetry) return;
    if (messageToRetry.type === 'inbound') return;
    
     setConversations(prev =>
        prev.map(c => {
            if (c.id === selectedId) {
                return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
            }
            return c;
        })
    );
    handleSendMessage(
      messageToRetry.text,
      messageToRetry.type === 'internal' ? 'internal' : 'outbound'
    );
  };
  
  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );
  
  if (isLoading || !currentUser) {
    return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] min-w-0 items-stretch bg-card md:max-h-full">
        <div className="h-full w-full max-w-sm flex-shrink-0 bg-card">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            activeFilter={activeFilter}
            onSetFilter={setActiveFilter}
          />
        </div>
        <div className="flex flex-[1_1_0%] min-w-0 flex-col h-full">
          {selectedConversation ? (
            <MessagePanel
              conversation={selectedConversation}
              currentUser={currentUser}
              onSetConversationState={handleSetConversationState}
              onSendMessage={handleSendMessage}
              onRetryMessage={handleRetryMessage}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-background p-4 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Select a conversation</h3>
              <p className="mt-2 text-muted-foreground">Choose from an existing conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}