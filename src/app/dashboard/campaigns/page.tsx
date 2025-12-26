// ⚠️ CAMPAIGNS PAGE INVARIANT
// This page handles campaign lifecycle UI only.
// States, actions, confirmations are intentionally UI-only.
// DO NOT move logic to dashboard layout or shared components.
// Any backend wiring must preserve these UX guardrails.

'use client';
// ⚠️ SCROLLING INVARIANT
// Scrolling is intentionally handled at the PAGE level.
// DO NOT move overflow / height logic to dashboard layout.
// Changing global layout will break Inbox & Chat.

import {
  PlusCircle,
  MoreHorizontal,
  Search,
  Send,
  FileText,
  Loader,
  Archive,
  Pause,
  Play,
  Edit,
  Copy,
  Calendar,
  X,
  BarChart,
} from 'lucide-react';
import * as React from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { Campaign, Template } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const mockTemplates: Template[] = [
    { id: 'TPL001', name: 'welcome_message', category: 'Marketing', content: 'Hello {{1}}! Welcome to Wanderlynx. How can we help you plan your next adventure?', status: 'Approved' },
    { id: 'TPL002', name: 'trip_reminder', category: 'Utility', content: 'Hi {{1}}, This is a reminder about your upcoming trip {{2}} which starts on {{3}}.', status: 'Approved' },
    { id: 'TPL003', name: 'promo_q2_2024', category: 'Marketing', content: 'Ready for a new adventure? Get 15% off our new trip to {{1}}! Limited time offer.', status: 'Approved' },
    { id: 'TPL004', name: 'payment_issue', category: 'Utility', content: 'Hello, we noticed an issue with your payment for booking {{1}}. Please contact us to resolve it. Thank you.', status: 'Pending' },
    { id: 'TPL005', name: 'booking_confirmation_v1', category: 'Utility', content: 'Your booking for {{1}} is confirmed! Your booking ID is {{2}}.', status: 'Approved' },
    { id: 'TPL006', name: 'payment_pending_v1', category: 'Utility', content: 'Reminder: A payment of {{1}} is due on {{2}} for your upcoming trip.', status: 'Approved' },
];

const statusConfig = {
  Draft: { variant: 'outline', icon: Edit, label: 'Draft' },
  Scheduled: { variant: 'secondary', icon: Calendar, label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  Sending: { variant: 'secondary', icon: Loader, label: 'Sending', className: 'animate-spin' },
  Paused: { variant: 'secondary', icon: Pause, label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
  Completed: { variant: 'default', icon: Send, label: 'Completed', className: 'bg-green-100 text-green-800' },
  Failed: { variant: 'destructive', icon: X, label: 'Failed' },
  Archived: { variant: 'secondary', icon: Archive, label: 'Archived' },
} as const;

type ConfirmationState = {
    action: 'Send' | 'Schedule' | 'Cancel' | 'Pause' | 'Resume' | 'Archive' | null;
    campaign: Campaign | null;
}

function CreateCampaignDialog({
  open,
  onOpenChange,
  onCampaignCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated: (newCampaign: Campaign) => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<Template | null>(null);

  const handleCreate = async () => {
    if (!name || !selectedTemplate) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a campaign name and select a template.',
      });
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
        const newCampaign: Campaign = {
            id: `camp_${Date.now()}`,
            name,
            templateName: selectedTemplate.name,
            templateContent: selectedTemplate.content,
            status: 'Draft',
            audienceCount: 12500, // Mocked
            sent: 0,
            failed: 0,
            createdAt: new Date().toISOString(),
            messages: [],
            variables: {},
            statusMessage: 'Campaign created in draft mode.',
            type: 'Template',
        };
        onCampaignCreated(newCampaign);
        toast({
            title: 'Campaign Created',
            description: `Campaign "${name}" has been created as a draft.`,
        });
        setIsLoading(false);
        onOpenChange(false);
        setName('');
        setSelectedTemplate(null);
    }, 500);

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new broadcast message for your contacts. This will be saved as a draft.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              placeholder="e.g., Summer Sale Announcement"
              suppressHydrationWarning={true}
            />
          </div>
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
                {mockTemplates.filter(t => t.status === 'Approved').length > 0 ? (
                  mockTemplates.filter(t => t.status === 'Approved').map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No approved templates found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Audience</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-xl text-muted-foreground"
                    disabled
                  >
                    Select Audience...
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Audience selection coming soon.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            className="rounded-full"
            size="lg"
            disabled={!selectedTemplate || !name || isLoading}
          >
            {isLoading ? (
              <Loader className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Creating...' : 'Create Draft Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmationDialog({ state, onConfirm, onCancel }: { state: ConfirmationState; onConfirm: () => void; onCancel: () => void; }) {
    if (!state.action || !state.campaign) return null;

    const messages = {
        Send: `This will immediately send the campaign "${state.campaign.name}" to ${state.campaign.audienceCount.toLocaleString()} contacts.`,
        Schedule: `This will schedule the campaign "${state.campaign.name}" to be sent to ${state.campaign.audienceCount.toLocaleString()} contacts.`,
        Cancel: `This will cancel the scheduled campaign "${state.campaign.name}" and return it to a draft.`,
        Pause: 'This will pause the currently sending campaign. Messages already in the queue may still be sent.',
        Resume: 'This will resume sending the paused campaign.',
        Archive: 'This will archive the campaign, hiding it from the main list. This action can be undone later.',
    };

    const titles = {
        Send: 'Confirm Send Campaign',
        Schedule: 'Confirm Schedule Campaign',
        Cancel: 'Confirm Cancellation',
        Pause: 'Confirm Pause Campaign',
        Resume: 'Confirm Resume Campaign',
        Archive: 'Confirm Archive Campaign',
    };

    return (
        <AlertDialog open={!!state.action} onOpenChange={onCancel}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{titles[state.action]}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {messages[state.action]}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={state.action === 'Send' || state.action === 'Cancel' ? 'bg-destructive hover:bg-destructive/90' : ''}>
                        {state.action}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

const ActionMenuItem = ({ children, disabled, tooltip }: { children: React.ReactNode; disabled?: boolean; tooltip?: string; onClick?: () => void; }) => {
    if (disabled) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="w-full">
                        <DropdownMenuItem disabled>{children}</DropdownMenuItem>
                    </span>
                </TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        );
    }
    return <DropdownMenuItem onSelect={(e) => { e.preventDefault(); (children as any).props.onClick?.() }}>{React.cloneElement(children as any)}</DropdownMenuItem>;
};


export default function CampaignsPage() {
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
    const [filteredCampaigns, setFilteredCampaigns] = React.useState<Campaign[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isCreateOpen, setCreateOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [confirmationState, setConfirmationState] = React.useState<ConfirmationState>({ action: null, campaign: null });
    const { toast } = useToast();

    // Initial load
    React.useEffect(() => {
        setCampaigns([
            { id: 'camp_1', name: 'Q2 Promotion', templateName: 'promo_q2_2024', templateContent: 'Get 15% off our new trip to {{1}}!', status: 'Completed', audienceCount: 1200, sent: 1190, failed: 10, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), messages: [], variables: {}, statusMessage: 'Completed', type: 'Template'},
            { id: 'camp_2', name: 'New Welcome Flow', templateName: 'welcome_message', templateContent: 'Hello {{1}}! Welcome to Wanderlynx.', status: 'Sending', audienceCount: 50, sent: 10, failed: 0, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), messages: [], variables: {}, statusMessage: 'Sending...', type: 'Template' },
            { id: 'camp_3', name: 'July Trip Reminders', templateName: 'trip_reminder', templateContent: 'Hi {{1}}, a reminder about your trip {{2}}.', status: 'Draft', audienceCount: 85, sent: 0, failed: 0, createdAt: new Date().toISOString(), messages: [], variables: {}, statusMessage: 'Next actions: Edit, Send, or Schedule', type: 'Template' },
            { id: 'camp_4', name: 'August Newsletter', templateName: 'feedback_request_v3', templateContent: 'Hi {{1}}, thanks for traveling with us!', status: 'Scheduled', audienceCount: 15000, sent: 0, failed: 0, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), messages: [], variables: {}, statusMessage: 'Scheduled for tomorrow', type: 'Template' },
            { id: 'camp_5', name: 'Follow-up on Paused', templateName: 'trip_reminder', templateContent: 'This is a test...', status: 'Paused', audienceCount: 200, sent: 50, failed: 5, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), messages: [], variables: {}, statusMessage: 'Paused by user', type: 'Template' },
        ]);
        setIsLoading(false);
    }, []);

     React.useEffect(() => {
        const results = campaigns.filter(campaign =>
            !campaign.status.includes('Archived') && (
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredCampaigns(results);
    }, [searchTerm, campaigns]);
    
    const handleCampaignCreated = (newCampaign: Campaign) => {
        setCampaigns(prev => [newCampaign, ...prev]);
    }
    
    const handleConfirmAction = () => {
        if (!confirmationState.action || !confirmationState.campaign) return;

        const { action, campaign } = confirmationState;
        
        // Mock state change
        setCampaigns(prev => prev.map(c => {
            if (c.id === campaign.id) {
                switch(action) {
                    case 'Send': return { ...c, status: 'Sending', statusMessage: 'Queued for sending...' };
                    case 'Schedule': return { ...c, status: 'Scheduled', statusMessage: 'Scheduled to send.' };
                    case 'Cancel': return { ...c, status: 'Draft', statusMessage: 'Schedule cancelled. Ready to send.' };
                    case 'Pause': return { ...c, status: 'Paused', statusMessage: 'Campaign paused by user.' };
                    case 'Resume': return { ...c, status: 'Sending', statusMessage: 'Campaign resumed.' };
                    case 'Archive': return { ...c, status: 'Archived', statusMessage: 'Campaign archived.' };
                    default: return c;
                }
            }
            return c;
        }));

        toast({ title: 'Success', description: `Campaign "${campaign.name}" has been updated.` });
        setConfirmationState({ action: null, campaign: null });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <TooltipProvider>
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10 overflow-y-auto">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <p className="text-muted-foreground">
                        Track and manage your messaging campaigns.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full" onClick={() => setCreateOpen(true)}>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} suppressHydrationWarning={true} />
                </div>
            </div>
            
            {filteredCampaigns.length === 0 ? (
                 <div className="text-center py-20">
                    <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No campaigns yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Create a campaign to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.map((campaign) => {
                        const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.Draft;
                        const Icon = config.icon;
                        const progress = campaign.audienceCount > 0 ? ((campaign.sent + campaign.failed) / campaign.audienceCount) * 100 : 0;
                        const isDraft = campaign.status === 'Draft';
                        const isSending = campaign.status === 'Sending';
                        const isScheduled = campaign.status === 'Scheduled';
                        const isPaused = campaign.status === 'Paused';
                        const isDone = campaign.status === 'Completed' || campaign.status === 'Failed';
                        
                        return (
                            <Card key={campaign.id} className="group relative transition-all hover:shadow-lg flex flex-col">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                                        <CardDescription>{campaign.templateName}</CardDescription>
                                    </div>
                                    <Badge variant={config.variant as any} className={`flex items-center gap-2 ${config.className || ''}`}>
                                        <Icon className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
                                        <span>{config.label}</span>
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <Progress value={progress} />
                                </div>
                                    <div className="grid grid-cols-3 gap-4 text-center pt-2">
                                        <div>
                                            <p className="text-2xl font-bold">{campaign.sent}</p>
                                            <p className="text-sm text-muted-foreground">Sent</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{campaign.failed}</p>
                                            <p className="text-sm text-muted-foreground">Failed</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{campaign.audienceCount}</p>
                                            <p className="text-sm text-muted-foreground">Audience</p>
                                        </div>
                                    </div>
                                    
                                </CardContent>
                                <CardFooter className="flex flex-col items-start text-xs text-muted-foreground pt-2">
                                     <p className="truncate">{campaign.statusMessage}</p>
                                     <p>Created: {campaign.createdAt ? format(new Date(campaign.createdAt), "PP") : '-'}</p>
                                </CardFooter>

                                <div className="absolute top-4 right-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                aria-haspopup="true"
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl w-48">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <ActionMenuItem disabled={!isDraft} tooltip="Only drafts can be edited.">
                                                <button onClick={() => {}} className="flex items-center w-full"><Edit className="mr-2 h-4 w-4" /> Edit Draft</button>
                                            </ActionMenuItem>
                                             <ActionMenuItem disabled={!isDraft} tooltip="Only drafts can be sent.">
                                                <button onClick={() => setConfirmationState({ action: 'Send', campaign })} className="flex items-center w-full"><Send className="mr-2 h-4 w-4" /> Send Now</button>
                                            </ActionMenuItem>
                                             <ActionMenuItem disabled={!isDraft} tooltip="Only drafts can be scheduled.">
                                                <button onClick={() => {}} className="flex items-center w-full"><Calendar className="mr-2 h-4 w-4" /> Schedule</button>
                                            </ActionMenuItem>
                                            <DropdownMenuSeparator />
                                            <ActionMenuItem disabled={!isSending} tooltip="Only a sending campaign can be paused.">
                                                <button onClick={() => setConfirmationState({ action: 'Pause', campaign })} className="flex items-center w-full"><Pause className="mr-2 h-4 w-4" /> Pause</button>
                                            </ActionMenuItem>
                                            <ActionMenuItem disabled={!isPaused} tooltip="Only a paused campaign can be resumed.">
                                                <button onClick={() => setConfirmationState({ action: 'Resume', campaign })} className="flex items-center w-full"><Play className="mr-2 h-4 w-4" /> Resume</button>
                                            </ActionMenuItem>
                                            <ActionMenuItem disabled={!isScheduled} tooltip="Only a scheduled campaign can be cancelled.">
                                                <button onClick={() => setConfirmationState({ action: 'Cancel', campaign })} className="flex items-center w-full text-destructive"><X className="mr-2 h-4 w-4" /> Cancel Schedule</button>
                                            </ActionMenuItem>
                                            <DropdownMenuSeparator />
                                            <ActionMenuItem disabled={isDraft || isScheduled} tooltip="Only sent campaigns have reports.">
                                                <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex items-center"><BarChart className="mr-2 h-4 w-4" /> View Report</Link>
                                            </ActionMenuItem>
                                            <ActionMenuItem>
                                                <button onClick={() => {}} className="flex items-center w-full"><Copy className="mr-2 h-4 w-4" /> Duplicate</button>
                                            </ActionMenuItem>
                                            <ActionMenuItem disabled={!isDone} tooltip="Only completed or failed campaigns can be archived.">
                                                <button onClick={() => setConfirmationState({ action: 'Archive', campaign })} className="flex items-center w-full"><Archive className="mr-2 h-4 w-4" /> Archive</button>
                                            </ActionMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            <CreateCampaignDialog open={isCreateOpen} onOpenChange={setCreateOpen} onCampaignCreated={handleCampaignCreated} />
            <ConfirmationDialog state={confirmationState} onConfirm={handleConfirmAction} onCancel={() => setConfirmationState({ action: null, campaign: null })} />
        </main>
        </TooltipProvider>
    )
}
