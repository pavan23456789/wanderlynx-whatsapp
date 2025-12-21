'use client';

import { PlusCircle, MoreHorizontal, Search, Send, FileText, Users, Loader } from "lucide-react"
import * as React from 'react';
import Link from 'next/link';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Campaign, Template } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const statusConfig = {
    Completed: { variant: "default", icon: Send },
    Sending: { variant: "secondary", icon: Loader },
    Draft: { variant: "outline", icon: FileText },
    Failed: { variant: "destructive", icon: Send },
} as const;

function CreateCampaignDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const [name, setName] = React.useState('');
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
    const [variables, setVariables] = React.useState<Record<string, string>>({});
    
    const variablePlaceholders = React.useMemo(() => {
        if (!selectedTemplate) return [];
        const regex = /\{\{(\d+)\}\}/g;
        const matches = new Set<string>();
        let match;
        while((match = regex.exec(selectedTemplate.content)) !== null) {
            matches.add(match[1]);
        }
        return Array.from(matches).sort();
    }, [selectedTemplate]);

    React.useEffect(() => {
        if (open) {
            const fetchTemplates = async () => {
                const response = await fetch('/api/templates');
                if(response.ok) {
                    const allTemplates: Template[] = await response.json();
                    // Only allow marketing templates for campaigns initiated from this UI
                    const marketingTemplates = allTemplates.filter(t => t.status === 'Approved' && t.category === 'Marketing');
                    setTemplates(marketingTemplates);
                }
            };
            fetchTemplates();
        } else {
            // Reset form on close
            setName('');
            setSelectedTemplate(null);
            setVariables({});
        }
    }, [open]);

    const handleVariableChange = (key: string, value: string) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    };

    const handleCreate = async () => {
        if (!name || !selectedTemplate) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please provide a campaign name and select a template.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    templateName: selectedTemplate.name,
                    templateContent: selectedTemplate.content,
                    variables
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create campaign');
            }

            const newCampaign: Campaign = await response.json();
            toast({
                title: "Campaign Created",
                description: `Campaign "${name}" has started sending.`,
            });
            
            onOpenChange(false);
            router.push(`/dashboard/campaigns/${newCampaign.id}`);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                        Set up a new broadcast message for all your contacts.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="e.g., Summer Sale Announcement" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="template">Message Template</Label>
                        <Select onValueChange={(val) => setSelectedTemplate(templates.find(t => t.name === val) || null)}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select an approved marketing template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.length > 0 ? templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>) : <SelectItem value="none" disabled>No approved marketing templates</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedTemplate && (
                         <div className="space-y-4 p-4 bg-secondary/50 rounded-2xl">
                             <div className="space-y-2">
                                <Label className="text-muted-foreground">Template Preview</Label>
                                <p className="text-sm p-3 bg-background rounded-xl whitespace-pre-wrap">{selectedTemplate.content}</p>
                            </div>
                            {variablePlaceholders.length > 0 && (
                                <div className="space-y-4">
                                     <Label className="text-muted-foreground">Template Variables</Label>
                                     {variablePlaceholders.map(key => (
                                         <div key={key} className="space-y-2">
                                             <Label htmlFor={`var-${key}`} className="font-mono text-sm">{`{{${key}}}`}</Label>
                                             <Input 
                                                id={`var-${key}`} 
                                                value={variables[key] || ''} 
                                                onChange={e => handleVariableChange(key, e.target.value)}
                                                className="rounded-xl"
                                                placeholder={`Enter value for variable ${key}`}
                                             />
                                         </div>
                                     ))}
                                </div>
                            )}
                         </div>
                    )}
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900 rounded-r-lg">
                        <p className="font-bold">Audience: All Contacts</p>
                        <p className="text-sm">This campaign will be sent to every contact in your system.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} className="rounded-full" size="lg" disabled={!selectedTemplate || templates.length === 0 || isLoading}>
                        {isLoading ? <Loader className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                        {isLoading ? 'Creating...' : 'Create and Send Campaign'}
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
    const { toast } = useToast();

    const fetchCampaigns = React.useCallback(async () => {
        try {
            const response = await fetch('/api/campaigns');
             if (!response.ok) throw new Error('Failed to fetch campaigns');
            const data = await response.json();
            setCampaigns(data);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }, [toast]);
    
    React.useEffect(() => {
        fetchCampaigns();
        const interval = setInterval(fetchCampaigns, 10000); // Poll for status updates
        return () => clearInterval(interval);
    }, [fetchCampaigns]);

     React.useEffect(() => {
        const results = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.templateName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCampaigns(results);
    }, [searchTerm, campaigns]);
    
    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <p className="text-muted-foreground">
                        Track and manage your messaging campaigns.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full" onClick={() => setCreateOpen(true)} suppressHydrationWarning={true}>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => {
                    const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.Draft;
                    const Icon = config.icon;
                    return (
                        <Link href={`/dashboard/campaigns/${campaign.id}`} key={campaign.id} className="group relative">
                            <Card className="h-full transition-all group-hover:shadow-lg">
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                                        <CardDescription>{campaign.templateName}</CardDescription>
                                    </div>
                                    <Badge variant={config.variant as any} className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${campaign.status === 'Sending' ? 'animate-spin' : ''}`} />
                                        <span>{campaign.status}</span>
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Progress</span>
                                            <span>{Math.round(((campaign.sent + campaign.failed) / campaign.audienceCount) * 100) || 0}%</span>
                                        </div>
                                        <Progress value={((campaign.sent + campaign.failed) / campaign.audienceCount) * 100 || 0} />
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
                                        Created: {format(new Date(campaign.createdAt), "PP")}
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
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} disabled>Pause</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()} disabled>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()} disabled>
                                                Archive
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        </Link>
                    )
                })}
            </div>
            <CreateCampaignDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
        </main>
    )
}
