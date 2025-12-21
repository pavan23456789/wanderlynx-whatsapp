'use client';

import { PlusCircle, MoreHorizontal, Search, Send, Clock, CheckCircle, XCircle } from "lucide-react"
import * as React from 'react';

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
import { getCampaigns, getTemplates, getContacts, Campaign, Template, Contact, saveCampaigns } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";


const statusConfig = {
    Sent: { variant: "default", icon: CheckCircle },
    Delivering: { variant: "secondary", icon: Send },
    Scheduled: { variant: "outline", icon: Clock },
    Failed: { variant: "destructive", icon: XCircle },
} as const;

function CreateCampaignDialog({ open, onOpenChange, onCampaignCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onCampaignCreated: (campaign: Campaign) => void }) {
    const { toast } = useToast();
    const [name, setName] = React.useState('');
    const [template, setTemplate] = React.useState('');
    const [audience, setAudience] = React.useState('all');
    // Only allow marketing templates for campaigns initiated from this UI
    const templates = getTemplates().filter(t => t.status === 'Approved' && t.category === 'Marketing');
    const contacts = getContacts();

    const handleCreate = () => {
        if (!name || !template) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please provide a campaign name and select a template.",
            });
            return;
        }

        const newCampaign: Campaign = {
            id: `CAMP${Date.now()}`,
            name,
            template,
            status: "Scheduled",
            sent: 0,
            delivered: 0,
            read: 0,
            date: new Date().toISOString().split('T')[0],
        };

        // Simulate scheduling, sending, and final state updates
        onCampaignCreated(newCampaign); 

        setTimeout(() => {
            const updatedCampaign = { ...newCampaign, status: 'Delivering' as const, sent: audience === 'all' ? contacts.length : 0 };
            onCampaignCreated(updatedCampaign);
        }, 2000); 
        
        setTimeout(() => {
             const finalCampaign = { ...newCampaign, status: 'Sent' as const, sent: audience === 'all' ? contacts.length : 0, delivered: Math.floor((audience === 'all' ? contacts.length : 0) * 0.95), read: Math.floor((audience === 'all' ? contacts.length : 0) * 0.8) };
             onCampaignCreated(finalCampaign);
        }, 5000);


        toast({
            title: "Campaign Scheduled",
            description: `Campaign "${name}" has been scheduled to send.`,
        });

        onOpenChange(false);
        setName('');
        setTemplate('');
        setAudience('all');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                        Set up a new broadcast message for your contacts.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 rounded-xl" placeholder="e.g., Summer Sale" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="template" className="text-right">Template</Label>
                         <Select value={template} onValueChange={setTemplate}>
                            <SelectTrigger className="col-span-3 rounded-xl">
                                <SelectValue placeholder="Select a marketing template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.length > 0 ? templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>) : <SelectItem value="none" disabled>No approved marketing templates</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="audience" className="text-right">Audience</Label>
                        <Select value={audience} onValueChange={setAudience}>
                            <SelectTrigger className="col-span-3 rounded-xl">
                                <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Contacts</SelectItem>
                                <SelectItem value="uploaded" disabled>Uploaded List (coming soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} className="rounded-full" size="lg" disabled={templates.length === 0} suppressHydrationWarning={true}>Schedule Campaign</Button>
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

    React.useEffect(() => {
        const data = getCampaigns();
        setCampaigns(data);
        setFilteredCampaigns(data);
    }, []);

     React.useEffect(() => {
        const results = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.template.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCampaigns(results);
    }, [searchTerm, campaigns]);

    const handleCampaignCreated = (campaign: Campaign) => {
        setCampaigns(prevCampaigns => {
            const existingIndex = prevCampaigns.findIndex(c => c.id === campaign.id);
            let updatedCampaigns;
            if (existingIndex > -1) {
                updatedCampaigns = prevCampaigns.map(c => c.id === campaign.id ? campaign : c);
            } else {
                updatedCampaigns = [campaign, ...prevCampaigns];
            }
            saveCampaigns(updatedCampaigns);
            return updatedCampaigns;
        });
    }

    const deleteCampaign = (id: string) => {
        const updated = campaigns.filter(c => c.id !== id);
        setCampaigns(updated);
        saveCampaigns(updated);
    }


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
                    const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.Scheduled;
                    const Icon = config.icon;
                    return (
                        <Card key={campaign.id} className="group relative">
                             <CardHeader className="flex flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl mb-1">{campaign.name}</CardTitle>
                                    <CardDescription>{campaign.template}</CardDescription>
                                </div>
                                 <Badge variant={config.variant as any} className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{campaign.status}</span>
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Read</span>
                                        <span>{Math.round((campaign.read / campaign.sent) * 100) || 0}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2.5">
                                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(campaign.read / campaign.sent) * 100 || 0}%` }}></div>
                                    </div>
                               </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold">{campaign.sent}</p>
                                        <p className="text-sm text-muted-foreground">Sent</p>
                                    </div>
                                     <div>
                                        <p className="text-2xl font-bold">{campaign.delivered}</p>
                                        <p className="text-sm text-muted-foreground">Delivered</p>
                                    </div>
                                     <div>
                                        <p className="text-2xl font-bold">{campaign.read}</p>
                                        <p className="text-sm text-muted-foreground">Read</p>
                                    </div>
                                </div>
                                 <div className="text-sm text-muted-foreground pt-2">
                                    Date: {new Date(campaign.date).toLocaleDateString()}
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
                                            suppressHydrationWarning={true}
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                                        <DropdownMenuItem disabled>Pause</DropdownMenuItem>
                                        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => deleteCampaign(campaign.id)}>
                                            Archive
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    )
                })}
            </div>
            <CreateCampaignDialog open={isCreateOpen} onOpenChange={setCreateOpen} onCampaignCreated={handleCampaignCreated} />
        </main>
    )
}
