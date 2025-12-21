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

const statusVariant = {
    Approved: "default",
    Pending: "secondary",
    Rejected: "destructive",
}

export default function TemplatesPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Message Templates</CardTitle>
                            <CardDescription>
                                Create and manage your WhatsApp message templates.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Input placeholder="Search templates..." className="w-64" />
                             <Button size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Template
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="w-2/5">Content</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{template.category}</TableCell>
                                    <TableCell className="truncate">{template.content}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[template.status as keyof typeof statusVariant] || "outline"}>
                                            {template.status}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    Delete
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
