import {
    File,
    PlusCircle,
    Download,
    Send,
    MoreHorizontal
} from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const contacts = [
    {
        id: "1",
        name: "Olivia Martin",
        avatar: "https://picsum.photos/seed/1/40/40",
        phone: "+1 123 456 7890",
        email: "olivia.martin@email.com",
        trip: "Paris 2024",
        tags: ["new"],
    },
    {
        id: "2",
        name: "Jackson Lee",
        avatar: "https://picsum.photos/seed/2/40/40",
        phone: "+1 234 567 8901",
        email: "jackson.lee@email.com",
        trip: "Tokyo 2025",
        tags: ["follow-up"],
    },
    {
        id: "3",
        name: "Isabella Nguyen",
        avatar: "https://picsum.photos/seed/3/40/40",
        phone: "+1 345 678 9012",
        email: "isabella.nguyen@email.com",
        trip: "Rome 2024",
        tags: [],
    },
    {
        id: "4",
        name: "William Kim",
        avatar: "https://picsum.photos/seed/4/40/40",
        phone: "+1 456 789 0123",
        email: "will@email.com",
        trip: "Sydney 2025",
        tags: ["vip"],
    },
    {
        id: "5",
        name: "Sophia Gonzalez",
        avatar: "https://picsum.photos/seed/5/40/40",
        phone: "+1 567 890 1234",
        email: "sophia.gonzalez@email.com",
        trip: "London 2024",
        tags: ["new"],
    },
]

export default function ContactsPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Contacts</CardTitle>
                            <CardDescription>
                                Manage your contacts and send them campaigns.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm">
                                <File className="h-4 w-4 mr-2" />
                                Upload CSV
                            </Button>
                             <Button size="sm">
                                <Send className="h-4 w-4 mr-2" />
                                Send Campaign
                            </Button>
                            <Button size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Contact
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Trip Details</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell>
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8" data-ai-hint="person portrait">
                                                <AvatarImage src={contact.avatar} />
                                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{contact.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{contact.phone}</TableCell>
                                    <TableCell>{contact.email}</TableCell>
                                    <TableCell>{contact.trip}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {contact.tags.map(tag => (
                                                <Badge key={tag} variant={tag === 'new' ? 'default' : 'secondary'}>{tag}</Badge>
                                            ))}
                                        </div>
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
                                                <DropdownMenuItem>View conversation</DropdownMenuItem>
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
