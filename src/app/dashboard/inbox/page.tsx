'use client';

import * as React from 'react';
import { Search, Send, Paperclip, Smile, Phone, Video, RefreshCw, AlertTriangle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Conversation, Message, Template } from '@/lib/data';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isAfter, subHours } from 'date-fns';


function TemplateReply({ selectedConv, templates, onReply, isSending }: { selectedConv: Conversation, templates: Template[], onReply: (text: string, params: string[]) => void, isSending: boolean }) {
    const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
    const [templateParams, setTemplateParams] = React.useState<string[]>([]);
    const paramCount = React.useMemo(() => {
        if (!selectedTemplate) return 0;
        const matches = selectedTemplate.content.match(/\{\{\d+\}\}/g);
        return matches ? new Set(matches).size : 0;
    }, [selectedTemplate]);

    React.useEffect(() => {
        if (selectedTemplate) {
            setTemplateParams(Array(paramCount).fill(''));
        } else {
            setTemplateParams([]);
        }
    }, [selectedTemplate, paramCount]);

    const handleParamChange = (index: number, value: string) => {
        const newParams = [...templateParams];
        newParams[index] = value;
        setTemplateParams(newParams);
    };

    const handleSendTemplate = () => {
        if (!selectedTemplate || isSending) return;
        onReply(selectedTemplate.name, templateParams);
    };

    return (
        <div className="p-4 space-y-4">
             <div className="flex items-center gap-2 rounded-2xl border border-yellow-500/50 bg-yellow-50 p-4 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertTriangle className="h-6 w-6" />
                <div className="text-sm">
                    <p className="font-bold">24-Hour Window Closed</p>
                    <p>You can only reply with a pre-approved template message.</p>
                </div>
            </div>
            <Select onValueChange={(name) => setSelectedTemplate(templates.find(t => t.name === name) || null)}>
                <SelectTrigger className="flex-1 rounded-full text-base">
                    <SelectValue placeholder="Select a template to reply..." />
                </SelectTrigger>
                <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>

            {selectedTemplate && (
                <div className="space-y-4 pt-2">
                    <div className="rounded-2xl bg-secondary p-4">
                        <p className="text-sm text-muted-foreground">Template Preview:</p>
                        <p className="text-base">{selectedTemplate.content}</p>
                    </div>
                    {paramCount > 0 && Array.from({ length: paramCount }, (_, i) => (
                         <div key={i} className="space-y-2">
                            <Label htmlFor={`param-${i+1}`}>Parameter &#123;&#123;{i + 1}&#125;&#125;</Label>
                            <Input 
                                id={`param-${i+1}`} 
                                placeholder={`Enter value for {{${i+1}}}`}
                                value={templateParams[i] || ''}
                                onChange={(e) => handleParamChange(i, e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    ))}
                </div>
            )}
            
            <Button size="lg" className="w-full rounded-full" onClick={handleSendTemplate} disabled={!selectedTemplate || isSending}>
                <Send className="h-5 w-5 mr-2" />
                {isSending ? 'Sending...' : 'Send Template'}
            </Button>
        </div>
    );
}


export default function InboxPage() {
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = React.useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = React.useState<Conversation | null>(null);
    const [isWindowClosed, setIsWindowClosed] = React.useState(false);
    const [messageText, setMessageText] = React.useState('');
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSending, setIsSending] = React.useState(false);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const fetchTemplates = React.useCallback(async () => {
        // In a real app, this would be an API call.
        // For now, we simulate fetching approved templates.
        const response = await fetch('/api/templates');
        if (response.ok) {
            const allTemplates = await response.json();
            setTemplates(allTemplates.filter((t: Template) => t.status === 'Approved'));
        }
    }, []);

    const fetchConversations = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/conversations');
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const data: Conversation[] = await response.json();
            setConversations(data);
            
            if (selectedConv) {
                const updatedSelected = data.find(c => c.id === selectedConv.id);
                if(updatedSelected) setSelectedConv(updatedSelected);
                else setSelectedConv(data[0] || null);
            } else if (data.length > 0) {
                 setSelectedConv(data[0]);
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [toast, selectedConv]);


    React.useEffect(() => {
        fetchConversations();
        fetchTemplates();
        const interval = setInterval(fetchConversations, 15000); // Poll for new messages every 15 seconds
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTemplates]);
    
    React.useEffect(() => {
        const results = conversations.filter(conv =>
            conv.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredConversations(results);
    }, [searchTerm, conversations]);

    React.useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [selectedConv?.messages]);

    React.useEffect(() => {
        if (selectedConv?.lastMessageTimestamp) {
            const lastMessageDate = new Date(selectedConv.lastMessageTimestamp);
            const limit = subHours(new Date(), 24);
            setIsWindowClosed(isAfter(limit, lastMessageDate));
        } else {
            setIsWindowClosed(true); // Default to closed if no timestamp
        }
    }, [selectedConv]);

    const handleSelectConversation = (conv: Conversation) => {
        const updatedConversations = conversations.map(c => 
            c.id === conv.id ? {...c, unread: 0} : c
        );
        setConversations(updatedConversations); // Optimistic UI update
        setSelectedConv({ ...conv, unread: 0 });
    };

    const handleReply = async (text: string, templateParams?: string[]) => {
        if (!selectedConv || isSending) return;

        const isTemplateReply = isWindowClosed;
        const textToSend = text;
        if (!textToSend.trim()) return;

        setIsSending(true);

        try {
            const response = await fetch('/api/conversations/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: selectedConv.id,
                    text: textToSend,
                    isTemplate: isTemplateReply,
                    templateParams: templateParams
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }

            const newConversation: Conversation = await response.json();
            
            setConversations(prev => prev.map(c => c.id === newConversation.id ? newConversation : c));
            setSelectedConv(newConversation);
            
            setMessageText('');

        } catch (error) {
            toast({ variant: 'destructive', title: 'Send Failed', description: (error as Error).message });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <TooltipProvider>
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full max-h-screen items-stretch"
            >
                <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                    <div className="flex h-full flex-col bg-card rounded-2xl shadow-sm m-4 mr-0">
                        <div className="p-4 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="Search conversations..." className="pl-10 rounded-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={fetchConversations} disabled={isLoading}>
                                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-2 p-4 pt-0">
                                {filteredConversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        className={cn(
                                            'flex flex-col items-start gap-2 rounded-2xl p-4 text-left text-sm transition-all hover:bg-secondary',
                                            selectedConv?.id === conv.id && 'bg-secondary'
                                        )}
                                        onClick={() => handleSelectConversation(conv)}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                                                    <AvatarImage src={conv.avatar} alt={conv.name} />
                                                    <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="font-semibold text-base">{conv.name}</div>
                                            </div>
                                            <div
                                                className={cn(
                                                    'text-xs',
                                                    selectedConv?.id === conv.id ? 'text-foreground' : 'text-muted-foreground'
                                                )}
                                            >
                                                {formatDistanceToNow(new Date(conv.lastMessageTimestamp), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className="line-clamp-2 text-sm text-muted-foreground">
                                            {conv.lastMessage}
                                        </div>
                                        {conv.unread > 0 ? (
                                            <Badge className="ml-auto bg-primary text-primary-foreground">{conv.unread}</Badge>
                                        ) : null}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={75}>
                    {selectedConv ? (
                        <div className="flex h-full flex-col bg-card rounded-2xl shadow-sm m-4 ml-0">
                            <div className="flex items-center p-4">
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                                        <AvatarImage src={selectedConv.avatar} alt={selectedConv.name} />
                                        <AvatarFallback>{selectedConv.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold text-base">{selectedConv.name}</div>
                                        <div className="text-sm text-muted-foreground">{selectedConv.id}</div>
                                    </div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-5 w-5"/></Button>
                                    <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-5 w-5"/></Button>
                                </div>
                            </div>
                            <Separator />
                            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                                <div className="space-y-6">
                                    {selectedConv.messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex items-end gap-3", msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                                            {msg.sender !== 'me' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConv.avatar} /><AvatarFallback>{selectedConv.name.charAt(0)}</AvatarFallback></Avatar>}
                                            <div className={cn("max-w-md rounded-2xl p-4 text-base", msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                                                <p>{msg.text}</p>
                                                 <div className={cn("flex items-center gap-2 text-xs mt-2", msg.sender === 'me' ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground')}>
                                                    <span>{formatDistanceToNow(new Date(msg.time), { addSuffix: true })}</span>
                                                    {msg.sender === 'me' && (
                                                        <Badge variant="secondary" className="text-xs">{msg.status}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <Separator />
                            
                                {isWindowClosed ? (
                                    <TemplateReply selectedConv={selectedConv} templates={templates} onReply={handleReply} isSending={isSending}/>
                                ) : (
                                    <div className="p-4 relative">
                                        <Textarea
                                            placeholder="Type your message..."
                                            className="resize-none pr-40 rounded-2xl p-4"
                                            rows={1}
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleReply(messageText);
                                                }
                                            }}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <Paperclip className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Attach File (Not Implemented)</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <Smile className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Add Emoji (Not Implemented)</TooltipContent>
                                            </Tooltip>
                                            <Button size="lg" className="ml-2 rounded-full" onClick={() => handleReply(messageText)} disabled={isSending}>
                                                <Send className="h-5 w-5 mr-2"/>
                                                {isSending ? 'Sending...' : 'Send'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center p-4">
                            <div className="text-center">
                                {isLoading ? (
                                    <p className="text-lg font-medium text-muted-foreground">Loading conversations...</p>
                                ) : (
                                    <>
                                        <p className="text-lg font-medium">No conversation selected</p>
                                        <p className="text-muted-foreground">Select a conversation to start chatting.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    );
}
