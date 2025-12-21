import { PlusCircle, MoreHorizontal } from "lucide-react"

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
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

const statusVariant = {
    Sent: "default",
    Delivering: "secondary",
    Scheduled: "outline",
    Failed: "destructive",
}

export default function CampaignsPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Campaigns</CardTitle>
                            <CardDescription>
                                Track and manage your messaging campaigns.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Search campaigns..." className="w-64" />
                            <Button size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Campaign
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Progress (Sent/Delivered/Read)</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">{campaign.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[campaign.status as keyof typeof statusVariant] || "outline"}>
                                            {campaign.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{campaign.template}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={(campaign.delivered / campaign.sent) * 100 || 0} className="w-32" />
                                            <span className="text-xs text-muted-foreground">{campaign.sent}/{campaign.delivered}/{campaign.read}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{campaign.date}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    aria-haspopup="true"
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Pause</DropdownMenuItem>
                                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Archive
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
