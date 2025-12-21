import {
    File,
    PlusCircle,
    Download,
    Send,
    MoreHorizontal,
    Search
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
import { Input } from "@/components/ui/input"
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
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground">
                        Manage your contacts and send them campaigns.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <Button size="lg" className="rounded-full">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Add Contact
                    </Button>
                </div>
            </div>

             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-10 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                        <File className="h-4 w-4 mr-2" />
                        Upload CSV
                    </Button>
                     <Button size="sm" className="rounded-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {contacts.map((contact) => (
                    <Card key={contact.id} className="group">
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 mb-4" data-ai-hint="person portrait">
                                <AvatarImage src={contact.avatar} />
                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-semibold">{contact.name}</h3>
                            <p className="text-muted-foreground text-sm">{contact.email}</p>
                            <p className="text-muted-foreground text-sm">{contact.phone}</p>
                            <p className="text-sm mt-2">{contact.trip}</p>
                            <div className="flex gap-2 mt-4">
                                {contact.tags.map(tag => (
                                    <Badge key={tag} variant={tag === 'new' ? 'default' : tag === 'vip' ? 'destructive' : 'secondary'}>{tag}</Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardHeader className="p-0">
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
                                        <DropdownMenuItem>View conversation</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </main>
    )
}
