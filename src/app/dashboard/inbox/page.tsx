'use client';

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
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type Template as TemplateType,
} from '@/lib/data';
import { User, getCurrentUser } from '@/lib/auth';
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

// --- IN-PAGE MOCK DATA (As per instructions) ---

type Message = {
  id: string;
  type: 'inbound' | 'outbound' | 'internal';
  text: string;
  time: string; // ISO 8601 string
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  agentId?: string;
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
  pinned?: boolean;
  unread?: number;
  lastCustomerMessageAt?: number | null;
  lastAgentMessageAt?: number | null;
  state: 'Open' | 'Pending' | 'Resolved';
};

const now = new Date().getTime();

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

const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Olivia Martin',
    phone: '+1 415 555 2671',
    avatar: 'https://picsum.photos/seed/1/80/80',
    lastMessage: 'Sure, I can help with that. What is your booking ID?',
    lastMessageTimestamp: now - 2 * 60 * 1000,
    isWindowOpen: true,
    messages: [
      { id: 'msg_1_1', type: 'inbound', text: 'Hi there, I have a question about my booking.', time: new Date(now - 3 * 60 * 1000).toISOString() },
      { id: 'msg_1_2', type: 'outbound', text: 'Sure, I can help with that. What is your booking ID?', time: new Date(now - 2 * 60 * 1000).toISOString(), status: 'read', agentId: '2' },
    ],
    assignedTo: '2',
    pinned: true,
    unread: 0,
    lastCustomerMessageAt: now - 3 * 60 * 1000,
    lastAgentMessageAt: now - 2 * 60 * 1000,
    state: 'Open',
  },
  {
    id: 'conv_2',
    name: 'Liam Anderson',
    phone: '+1 212 555 1234',
    avatar: 'https://picsum.photos/seed/2/80/80',
    lastMessage: 'Is it possible to upgrade my room?',
    lastMessageTimestamp: now - 65 * 60 * 1000,
    isWindowOpen: true,
    messages: [
      { id: 'msg_2_1', type: 'inbound', text: 'Hello, I booked the Bali trip for next month.', time: new Date(now - 70 * 60 * 1000).toISOString() },
      { id: 'msg_2_2', type: 'inbound', text: 'Is it possible to upgrade my room?', time: new Date(now - 65 * 60 * 1000).toISOString() },
      { id: 'msg_2_3', type: 'internal', text: 'This customer has a history of last-minute upgrade requests. Proceed with caution and offer standard rates only.', time: new Date(now - 60 * 60 * 1000).toISOString(), agentId: '1' },
    ],
    assignedTo: null,
    pinned: true,
    unread: 1,
    lastCustomerMessageAt: now - 65 * 60 * 1000,
    lastAgentMessageAt: null,
    state: 'Open',
  },
  {
    id: 'conv_3',
    name: 'Sophia Rodriguez',
    phone: '+44 20 7946 0958',
    avatar: 'https://picsum.photos/seed/3/80/80',
    lastMessage: 'Perfect, thank you so much for your help!',
    lastMessageTimestamp: now - 26 * 60 * 60 * 1000,
    isWindowOpen: false,
    messages: [
      { id: 'msg_3_1', type: 'inbound', text: 'I need to cancel my trip.', time: new Date(now - 27 * 60 * 60 * 1000).toISOString() },
      { id: 'msg_3_2', type: 'outbound', text: 'I have processed the cancellation for you. Your reference is CAN-12345.', time: new Date(now - 26.5 * 60 * 60 * 1000).toISOString(), status: 'read', agentId: '3' },
      { id: 'msg_3_3', type: 'inbound', text: 'Perfect, thank you so much for your help!', time: new Date(now - 26 * 60 * 60 * 1000).toISOString() },
    ],
    assignedTo: '3',
    pinned: false,
    unread: 0,
    lastCustomerMessageAt: now - 26 * 60 * 60 * 1000,
    lastAgentMessageAt: now - 26.5 * 60 * 60 * 1000,
    state: 'Resolved',
  },
  {
    id: 'conv_4',
    name: 'Noah Campbell',
    phone: '+61 2 9250 7111',
    avatar: 'https://picsum.photos/seed/4/80/80',
    lastMessage: 'Can I add another person to my booking? My booking ID is BK-2024-98A6F and I need to know ASAP thanks! It is a very long message to test the wrapping capability of the UI and to ensure that the preview text is handled correctly.',
    lastMessageTimestamp: now - 3 * 24 * 60 * 60 * 1000,
    isWindowOpen: false,
    messages: [
      { id: 'msg_4_1', type: 'inbound', text: 'Can I add another person to my booking? My booking ID is BK-2024-98A6F and I need to know ASAP thanks! It is a very long message to test the wrapping capability of the UI and to ensure that the preview text is handled correctly.', time: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'msg_4_2', type: 'outbound', text: 'Sent by Super Admin', time: new Date(now - 2.9 * 24 * 60 * 60 * 1000).toISOString(), status: 'sent', agentId: '1' }
    ],
    assignedTo: '2',
    pinned: false,
    unread: 0,
    lastCustomerMessageAt: now - 3 * 24 * 60 * 60 * 1000,
    lastAgentMessageAt: null,
    state: 'Pending',
  },
];

const mockTemplates: TemplateType[] = [
    { id: 'TPL001', name: 'follow_up_v1', category: 'Utility', content: 'Hi {{1}}, we missed you. Is there anything else we can help you with regarding your case?', status: 'Approved' },
    { id: 'TPL002', name: 'payment_issue', category: 'Utility', content: 'Hello, we noticed an issue with your payment for booking {{1}}. Please contact us to resolve it. Thank you.', status: 'Approved' },
    { id: 'TPL003', name: 'promo_q2_2024', category: 'Marketing', content: 'Ready for a new adventure? Get 15% off our new trip to {{1}}! Limited time offer.', status: 'Approved' },
];

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

const stateConfig = {
  Open: { className: 'bg-green-100 text-green-800' },
  Pending: { className: 'bg-yellow-100 text-yellow-800' },
  Resolved: { className: 'bg-gray-200 text-gray-800' },
} as const;

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
  // ⚠️ PREVIEW TEXT RULE
// Preview text is intentionally limited to 10 characters + ellipsis.
// This is a product decision. Do NOT change length or use CSS truncation.
const previewText = rawPreviewText.length > 10 ? `${rawPreviewText.slice(0, 10)}…` : rawPreviewText;

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
              <p className="font-bold text-foreground line-clamp-2">{previewText}</p>
            ) : (
              <p className="line-clamp-2">{previewText}</p>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
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
}: {
  conversation: Conversation;
  currentUser: User | null;
  onSetConversationState: (id: string, state: Conversation['state']) => void;
  onSendMessage: (text: string, type: 'outbound' | 'internal') => void;
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

  const handleSendTemplate = (template: TemplateType, variables: Record<string, string>) => {
        let content = template.content;
        for (const key in variables) {
            content = content.replace(`{{${key}}}`, variables[key]);
        }
        onSendMessage(content, 'outbound');
  };

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
             <Badge variant={conversation.isWindowOpen ? 'default' : 'secondary'} className={cn('font-bold', conversation.isWindowOpen ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600")}>
                {conversation.isWindowOpen ? 'Window Open' : 'Window Closed'}
             </Badge>
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
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Contact info</DropdownMenuItem>
              <DropdownMenuItem>Search</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
                onClick={() => onSetConversationState(conversation.id, 'Resolved')}
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Mark as Resolved</span>
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
              <MessageBubble key={m.id} message={m} agent={agent} assignedToId={conversation.assignedTo} />
            );
          })}
        </div>
      </ScrollArea>
       <ReplyBox
        onSend={(text) => onSendMessage(text, 'outbound')}
        onSendInternalNote={(text) => onSendMessage(text, 'internal')}
        onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
        isWindowOpen={conversation.isWindowOpen}
        assignedAgent={assignedAgent}
        currentUser={currentUser}
      />
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
}: {
  message: Message;
  agent: Agent | null | undefined;
  assignedToId?: string | null;
}) {
  const isOutbound = message.type === 'outbound';
  const isUnassignedReply = isOutbound && agent && agent.id !== assignedToId;

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        isOutbound ? 'items-end' : 'items-start'
      )}
    >
      {/* ⚠️ CHAT BUBBLE SAFETY */}
      {/* `w-fit` + `min-w-0` are REQUIRED to prevent flex-end */}
      {/* shrink-to-fit width collapse for long messages. */}
      {/* Do NOT remove or replace with flex-1 or w-full. */}
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
        <p className="block whitespace-pre-wrap break-all text-sm md:text-base">
          {message.text}
        </p>
      </div>
       <div className="mt-1 flex items-center justify-end gap-1 whitespace-nowrap px-1 text-[11px] text-muted-foreground/80">
        <span suppressHydrationWarning>
          {format(new Date(message.time), 'p')}
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
          {format(new Date(message.time), 'Pp')}
        </p>
      </div>
    </div>
  );
}

function ReplyBox({
  onSend,
  onSendInternalNote,
  onOpenTemplateDialog,
  isWindowOpen,
  assignedAgent,
  currentUser,
}: {
  onSend: (text: string) => void;
  onSendInternalNote: (text: string) => void;
  onOpenTemplateDialog: () => void;
  isWindowOpen: boolean;
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

  const getFooterLabel = () => {
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
           <div className="text-xs px-2 pb-1.5">
             {footerLabel}
           </div>
       )}
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

// Tooltip Components (kept for unassigned reply icon)
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
  const [conversations, setConversations] = React.useState<Conversation[]>(mockConversations);
  const [selectedId, setSelectedId] = React.useState<string | null>(mockConversations[0]?.id || null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleSetConversationState = (conversationId: string, state: Conversation['state']) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, state: state } : c
      )
    );
  };
  
  const handleSendMessage = (text: string, type: 'outbound' | 'internal') => {
    if (!selectedId || !currentUser || !text.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      type,
      text,
      time: new Date().toISOString(),
      agentId: currentUser.id,
      status: type === 'outbound' ? 'sent' : undefined,
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedId) {
          const updatedMessages = [...c.messages, newMessage];
          return { 
            ...c, 
            messages: updatedMessages,
            lastMessage: type !== 'internal' ? text : c.lastMessage,
            lastMessageTimestamp: new Date().getTime(),
             ...(type !== 'internal' && { unread: 0 }),
          };
        }
        return c;
      })
    );
  };
  
  const selectedConversation = React.useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [selectedId, conversations]
  );
  
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex h-full max-h-[calc(100vh-theme(spacing.14))] min-w-0 items-stretch bg-card md:max-h-full">
        <div className="h-full w-full max-w-sm flex-shrink-0 bg-card">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        {/* ⚠️ LAYOUT INVARIANT — DO NOT MODIFY */}
        {/* This panel MUST use `flex-[1_1_0%]` and `min-w-0`. */}
        {/* Changing this causes the middle panel to collapse horizontally */}
        {/* in a 3-column flex layout with a fixed sidebar. */}
        <div
          className="
            flex
            flex-[1_1_0%]
            min-w-0
            flex-col
            h-full
          "
        >
          {selectedConversation ? (
            <MessagePanel
              conversation={selectedConversation}
              currentUser={currentUser}
              onSetConversationState={handleSetConversationState}
              onSendMessage={handleSendMessage}
            />
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
    </>
  );
}
