import { PlusCircle, MoreHorizontal, Search, Send, Clock, CheckCircle, XCircle } from "lucide-react"

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

const campaigns = [
    {
        id: "CAMP001",
        name: "New Year Promo",
        template: "new_promo",
        status: "Sent",
        sent: 1000,
        delivered: 950,
        read: 800,
        date: "2023-12-28",
    },
    {
        id: "CAMP002",
        name: "Summer Sale Kickoff",
        template: "summer_sale",
        status: "Delivering",
        sent: 500,
        delivered: 250,
        read: 100,
        date: "2024-06-15",
    },
    {
        id: "CAMP003",
        name: "Paris Trip Reminders",
        template: "trip_confirmation",
        status: "Scheduled",
        sent: 0,
        delivered: 0,
        read: 0,
        date: "2024-07-01",
    },
    {
        id: "CAMP004",
        name: "Customer Feedback Request",
        template: "feedback_request",
        status: "Failed",
        sent: 200,
        delivered: 0,
        read: 0,
        date: "2024-05-20",
    },
];

const statusConfig = {
    Sent: { variant: "default", icon: CheckCircle },
    Delivering: { variant: "secondary", icon: Send },
    Scheduled: { variant: "outline", icon: Clock },
    Failed: { variant: "destructive", icon: XCircle },
}

export default function CampaignsPage() {
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
                     <Button size="lg" className="rounded-full">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                    const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.Scheduled;
                    const Icon = config.icon;
                    return (
                        <Card key={campaign.id} className="group">
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
                                    Date: {campaign.date}
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
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>Pause</DropdownMenuItem>
                                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            Archive
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </main>
    )
}
