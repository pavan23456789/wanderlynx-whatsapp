import { PlusCircle, MoreHorizontal, Search, FileText, CheckCircle, Clock, XCircle } from "lucide-react"

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

const templates = [
    {
        id: "TPL001",
        name: "welcome_message",
        category: "Marketing",
        content: "Hello {{1}}! Welcome to Travonex. How can we help you plan your next adventure?",
        status: "Approved",
    },
    {
        id: "TPL002",
        name: "trip_confirmation",
        category: "Transactional",
        content: "Your trip to {{1}} is confirmed! Your booking ID is {{2}}.",
        status: "Approved",
    },
    {
        id: "TPL003",
        name: "flight_reminder",
        category: "Transactional",
        content: "Reminder: Your flight {{1}} to {{2}} departs in 24 hours.",
        status: "Pending",
    },
    {
        id: "TPL004",
        name: "new_promo",
        category: "Marketing",
        content: "Don't miss out on our new year sale! Get up to 30% off on all packages.",
        status: "Rejected",
    },
];

const statusConfig = {
    Approved: { variant: "default", icon: CheckCircle },
    Pending: { variant: "secondary", icon: Clock },
    Rejected: { variant: "destructive", icon: XCircle },
}

export default function TemplatesPage() {
    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Message Templates</h1>
                    <p className="text-muted-foreground">
                        Create and manage your WhatsApp message templates.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Template
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search templates..." className="pl-10 rounded-full" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {templates.map((template) => {
                     const config = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.Pending;
                     const Icon = config.icon;
                     return (
                        <Card key={template.id} className="group flex flex-col">
                             <CardHeader>
                                <div className="flex items-start justify-between">
                                     <div className="flex items-center gap-4">
                                        <div className="bg-secondary p-3 rounded-xl">
                                             <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{template.name}</CardTitle>
                                            <CardDescription>{template.category}</CardDescription>
                                        </div>
                                     </div>
                                    <Badge variant={config.variant as any} className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <span>{template.status}</span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground line-clamp-3">{template.content}</p>
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
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            Delete
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
