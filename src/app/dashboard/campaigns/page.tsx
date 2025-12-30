'use client';

// ⚠️ CAMPAIGNS PAGE INVARIANT
// This page handles campaign lifecycle UI only.
// States, actions, confirmations are intentionally UI-only.
// DO NOT move logic to dashboard layout or shared components.
// Any backend wiring must preserve these UX guardrails.

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
  Lock,
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
import { getCurrentUser, User } from '@/lib/auth';
// FIX: Added the authFetch import
import { authFetch } from '@/utils/api-client';

// FIX: Added 'as const' to all variants to solve Badge TypeScript errors
const statusConfig = {
  Draft: { variant: 'outline' as const, icon: Edit, label: 'Draft', className: '' },
  Scheduled: { variant: 'secondary' as const, icon: Calendar, label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  Sending: { variant: 'secondary' as const, icon: Loader, label: 'Sending', className: 'animate-spin' },
  Paused: { variant: 'secondary' as const, icon: Pause, label: 'Paused', className: 'bg-yellow-100 text-yellow-800' },
  Completed: { variant: 'default' as const, icon: Send, label: 'Completed', className: 'bg-green-100 text-green-800' },
  Failed: { variant: 'destructive' as const, icon: X, label: 'Failed', className: '' },
  Archived: { variant: 'secondary' as const, icon: Archive, label: 'Archived', className: '' },
};

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
  onCampaignCreated: () => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  React.useEffect(() => {
    async function fetchTemplates() {
      if (open) {
        // FIX: Replaced fetch with authFetch
        const res = await authFetch('/api/templates');
        if (res.ok) {
           const data = await res.json();
           setTemplates(data);
        }
      }
    }
    fetchTemplates();
  }, [open]);

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
    try {
        // FIX: Replaced fetch with authFetch
        const response = await authFetch('/api/campaigns', {
            method: 'POST',
            body: JSON.stringify({
                name,
                templateName: selectedTemplate.name,
                templateContent: selectedTemplate.content,
                variables: {} 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create campaign');
        }

        onCampaignCreated();
        toast({
            title: 'Campaign Created',
            description: `Campaign "${name}" created successfully.`,
        });
        onOpenChange(false);
        setName('');
        setSelectedTemplate(null);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error Creating Campaign',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new broadcast message for your contacts. This will start sending immediately.
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
                  templates.find((t) => t.name === val) || null
                )
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select an approved template" />
              </SelectTrigger>
              <SelectContent>
                {templates.length > 0 ? (
                  templates.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Loading templates...
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
                  <div>
                    <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl text-muted-foreground"
                        disabled
                    >
                        All Contacts
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Audience selection is coming soon. Campaigns are sent to all contacts.</p>
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
            {isLoading ? 'Creating...' : 'Create & Send Campaign'}
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

const ActionMenuItem = ({ children, disabled, tooltip, onClick }: { children: React.ReactNode; disabled?: boolean; tooltip?: string; onClick?: () => void; }) => {
    const item = <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onClick?.()}} disabled={disabled}>{children}</DropdownMenuItem>
    
    if (disabled && tooltip) {
        return (
            <Tooltip>
                <TooltipTrigger asChild><div className="w-full">{item}</div></TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
            </Tooltip>
        );
    }
    return item;
};


export default function CampaignsPage() {
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
    const [filteredCampaigns, setFilteredCampaigns] = React.useState<Campaign[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isCreateOpen, setCreateOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [confirmationState, setConfirmationState] = React.useState<ConfirmationState>({ action: null, campaign: null });
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    // FIX: image_bf0a9d.png - Awaited the async user call
    React.useEffect(() => {
        async function loadUser() {
            const user = await getCurrentUser();
            setCurrentUser(user);
        }
        loadUser();
    }, []);

    const fetchCampaigns = React.useCallback(async () => {
        try {
            // FIX: Replaced fetch with authFetch
            const response = await authFetch('/api/campaigns');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch campaigns');
            }
            const data = await response.json();
            setCampaigns(data);
        } catch (error: any) {
            console.error("Fetch Error:", error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    React.useEffect(() => {
        fetchCampaigns();
        const interval = setInterval(fetchCampaigns, 5000); 
        return () => clearInterval(interval);
    }, [fetchCampaigns]);

     React.useEffect(() => {
        const results = campaigns.filter(campaign =>
            campaign.status !== 'Archived' && (
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredCampaigns(results);
    }, [searchTerm, campaigns]);
    
    const handleCampaignCreated = () => {
        fetchCampaigns();
    }
    
    const handleConfirmAction = () => {
        if (!confirmationState.action || !confirmationState.campaign) return;
        const { action, campaign } = confirmationState;
        toast({ title: 'Success', description: `Action "${action}" for campaign "${campaign.name}" requested.` });
        setConfirmationState({ action: null, campaign: null });
    };

    if (isLoading || !currentUser) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
    }

    if (currentUser.role === 'Customer Support') {
        return (
             <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10 text-center">
                <Lock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-3xl font-bold">Access Restricted</h1>
                <p className="text-muted-foreground">
                    Your role does not have permission to manage campaigns.
                </p>
                <Button asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </main>
        )
    }
    
    return (
        <TooltipProvider>
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10 overflow-y-auto">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <p className="text-muted-foreground">Track and manage your messaging campaigns.</p>
                </div>
                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full" onClick={() => setCreateOpen(true)}>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} suppressHydrationWarning={true} />
                </div>
            </div>
            
            {filteredCampaigns.length === 0 && !isLoading ? (
                 <div className="text-center py-20">
                    <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No campaigns found</h3>
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
                        
                        const canSendNow = currentUser.role === 'Super Admin';
                        const canPause = currentUser.role === 'Super Admin';

                        return (
                            <Card key={campaign.id} className="group relative transition-all hover:shadow-lg flex flex-col">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                                        <CardDescription>{campaign.templateName}</CardDescription>
                                    </div>
                                    {/* FIX: image_bf03f1.png - Applied config correctly */}
                                    <Badge variant={config.variant} className={`flex items-center gap-2 ${config.className}`}>
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
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl w-48">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <ActionMenuItem disabled={!isDraft}>
                                                <div className="flex items-center w-full"><Edit className="mr-2 h-4 w-4" /> Edit Draft</div>
                                            </ActionMenuItem>
                                             <ActionMenuItem disabled={!isDraft || !canSendNow} onClick={() => setConfirmationState({ action: 'Send', campaign })}>
                                                <div className="flex items-center w-full"><Send className="mr-2 h-4 w-4" /> Send Now</div>
                                            </ActionMenuItem>
                                            <DropdownMenuSeparator />
                                            <ActionMenuItem disabled={!isDone}>
                                                <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex items-center"><BarChart className="mr-2 h-4 w-4" /> View Report</Link>
                                            </ActionMenuItem>
                                            <ActionMenuItem disabled={!isDone} onClick={() => setConfirmationState({ action: 'Archive', campaign })}>
                                                <div className="flex items-center w-full"><Archive className="mr-2 h-4 w-4" /> Archive</div>
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