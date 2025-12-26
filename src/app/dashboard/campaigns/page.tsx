'use client';

import {
  PlusCircle,
  MoreHorizontal,
  Search,
  Send,
  FileText,
  Loader,
  Archive,
  Pause,
} from 'lucide-react';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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

const mockTemplates: Template[] = [
    { id: 'TPL001', name: 'welcome_message', category: 'Marketing', content: 'Hello {{1}}! Welcome to Wanderlynx. How can we help you plan your next adventure?', status: 'Approved' },
    { id: 'TPL002', name: 'trip_reminder', category: 'Utility', content: 'Hi {{1}}, This is a reminder about your upcoming trip {{2}} which starts on {{3}}.', status: 'Approved' },
    { id: 'TPL003', name: 'promo_q2_2024', category: 'Marketing', content: 'Ready for a new adventure? Get 15% off our new trip to {{1}}! Limited time offer.', status: 'Approved' },
    { id: 'TPL004', name: 'payment_issue', category: 'Utility', content: 'Hello, we noticed an issue with your payment for booking {{1}}. Please contact us to resolve it. Thank you.', status: 'Pending' },
];

const statusConfig = {
  Sent: { variant: 'default', icon: Send, className: 'bg-blue-100 text-blue-800' },
  Scheduled: { variant: 'secondary', icon: Loader, className: 'animate-spin' },
  Draft: { variant: 'outline', icon: FileText },
  Paused: { variant: 'destructive', icon: Pause },
} as const;


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
    
    // UI-only action, no API call
    setIsLoading(true);
    setTimeout(() => {
        const newCampaign: Campaign = {
            id: `camp_${Date.now()}`,
            name,
            templateName: selectedTemplate.name,
            templateContent: selectedTemplate.content, // Not in spec, but good for UI
            status: 'Draft',
            audienceCount: 0, // Mocked
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
    }, 500);

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new broadcast message for your contacts.
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
                <TooltipTrigger className="w-full">
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
            disabled={!selectedTemplate || isLoading}
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


export default function CampaignsPage() {
    const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
    const [filteredCampaigns, setFilteredCampaigns] = React.useState<Campaign[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isCreateOpen, setCreateOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    // Initial load
    React.useEffect(() => {
        setIsLoading(false);
    }, []);

     React.useEffect(() => {
        const results = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCampaigns(results);
    }, [searchTerm, campaigns]);
    
    const handleCampaignCreated = (newCampaign: Campaign) => {
        setCampaigns(prev => [newCampaign, ...prev]);
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <TooltipProvider>
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
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
                        return (
                            <Card key={campaign.id} className="group relative transition-all hover:shadow-lg">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                                        <CardDescription>{campaign.templateName}</CardDescription>
                                    </div>
                                    <Badge variant={config.variant as any} className={`flex items-center gap-2 ${config.className || ''}`}>
                                        <Icon className={`h-4 w-4 ${campaign.status === 'Scheduled' ? 'animate-spin' : ''}`} />
                                        <span>{campaign.status}</span>
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
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
                                    <div className="text-sm text-muted-foreground pt-2">
                                        Created: {campaign.createdAt ? format(new Date(campaign.createdAt), "PP") : '-'}
                                    </div>
                                </CardContent>
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
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><span className="w-full text-left">Pause</span></TooltipTrigger>
                                                    <TooltipContent><p>Coming soon</p></TooltipContent>
                                                </Tooltip>
                                            </DropdownMenuItem>
                                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><span className="w-full text-left">Archive</span></TooltipTrigger>
                                                    <TooltipContent><p>Coming soon</p></TooltipContent>
                                                </Tooltip>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            <CreateCampaignDialog open={isCreateOpen} onOpenChange={setCreateOpen} onCampaignCreated={handleCampaignCreated} />
        </main>
        </TooltipProvider>
    )
}
