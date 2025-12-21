'use client';

import * as React from 'react';
import { Search, Send, Paperclip, Smile, Phone, Video } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getConversations, getTemplates, addMessageToConversation, Conversation, Message, Template } from '@/lib/data';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function InboxPage() {
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = React.useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = React.useState<Conversation | null>(null);
    const [windowClosed, setWindowClosed] = React.useState(false);
    const [messageText, setMessageText] = React.useState('');
    const [template, setTemplate] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState("");
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const templates = getTemplates().filter(t => t.status === 'Approved');

    React.useEffect(() => {
        const data = getConversations();
        setConversations(data);
        setFilteredConversations(data);
        if (data.length > 0) {
            setSelectedConv(data[0]);
        }
    }, []);
    
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

    const handleSelectConversation = (conv: Conversation) => {
        const updatedConversations = conversations.map(c => 
            c.id === conv.id ? {...c, unread: 0} : c
        );
        setConversations(updatedConversations);
        setSelectedConv({ ...conv, unread: 0 });
    };

    const handleSendMessage = () => {
        if (!selectedConv || !messageText.trim()) return;

        const newMessage: Message = { sender: 'me', text: messageText, time: '' };
        const updatedConvos = addMessageToConversation(selectedConv.id, newMessage);

        setConversations(updatedConvos);
        const updatedSelected = updatedConvos.find(c => c.id === selectedConv.id);
        if (updatedSelected) {
            setSelectedConv(updatedSelected);
        }
        setMessageText('');
    };
    
    const handleSendTemplate = () => {
        if (!selectedConv || !template) {
            toast({
                variant: 'destructive',
                title: 'No Template Selected',
                description: 'Please select a template to send.',
            });
            return;
        }

        const selectedTemplate = templates.find(t => t.name === template);
        if (!selectedTemplate) return;

        // A real app would substitute variables here.
        const messageText = selectedTemplate.content.replace(/\{\{\d\}\}/g, '[variable]');

        const newMessage: Message = { sender: 'me', text: `TEMPLATE: ${messageText}`, time: '' };
        const updatedConvos = addMessageToConversation(selectedConv.id, newMessage);
        
        setConversations(updatedConvos);
        const updatedSelected = updatedConvos.find(c => c.id === selectedConv.id);
        if (updatedSelected) {
            setSelectedConv(updatedSelected);
        }
        setTemplate('');
        toast({ title: "Template Sent", description: `"${selectedTemplate.name}" was sent.` });
    }

    return (
        <TooltipProvider>
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full max-h-screen items-stretch"
            >
                <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                    <div className="flex h-full flex-col bg-card rounded-2xl shadow-sm m-4 mr-0">
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="Search conversations..." className="pl-10 rounded-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
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
                                                {conv.time}
                                            </div>
                                        </div>
                                        <div className="line-clamp-2 text-sm text-muted-foreground">
                                            {conv.lastMessage}
                                        </div>
                                        {conv.unread && conv.unread > 0 ? (
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
                                        <div className="text-sm text-muted-foreground">Active 2m ago</div>
                                    </div>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-5 w-5"/></Button>
                                    <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-5 w-5"/></Button>
                                    <Separator orientation="vertical" className="h-8 mx-2" />
                                    <div className="flex items-center space-x-2 p-2">
                                        <Switch id="window-mode" checked={windowClosed} onCheckedChange={setWindowClosed} />
                                        <Label htmlFor="window-mode" className="text-sm">24h Window Closed</Label>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                                <div className="space-y-6">
                                    {selectedConv.messages.map((msg, index) => (
                                        <div key={index} className={cn("flex items-end gap-3", msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                                            {msg.sender !== 'me' && <Avatar className="h-8 w-8"><AvatarImage src={selectedConv.avatar} /><AvatarFallback>{selectedConv.name.charAt(0)}</AvatarFallback></Avatar>}
                                            <div className={cn("max-w-md rounded-2xl p-4 text-base", msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none')}>
                                                <p>{msg.text}</p>
                                                <p className={cn("text-xs mt-2", msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{msg.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <Separator />
                             <div className="p-4">
                                {windowClosed ? (
                                    <div className="flex items-center gap-4">
                                        <Select value={template} onValueChange={setTemplate}>
                                            <SelectTrigger className="flex-1 rounded-full">
                                                <SelectValue placeholder="Select a template to reply..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Button size="lg" className="rounded-full" onClick={handleSendTemplate}>Send Template</Button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Type your message..."
                                            className="resize-none pr-40 rounded-2xl p-4"
                                            rows={1}
                                            value={messageText}
                                            onChange={e => setMessageText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
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
                                                <TooltipContent>Attach File</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full">
                                                        <Smile className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Add Emoji</TooltipContent>
                                            </Tooltip>
                                            <Button size="lg" className="ml-2 rounded-full" onClick={handleSendMessage}>
                                                <Send className="h-5 w-5 mr-2"/>
                                                Send
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center p-4">
                            <div className="text-center">
                                <p className="text-lg font-medium">No conversation selected</p>
                                <p className="text-muted-foreground">Select a conversation to start chatting.</p>
                            </div>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    );
}
