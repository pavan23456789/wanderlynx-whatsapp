'use client';

import * as React from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { getContacts, saveContacts, Contact } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

function ContactDialog({ open, onOpenChange, onSave, contact }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (contact: Contact) => void, contact: Contact | null }) {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<Contact>>({});

    React.useEffect(() => {
        if (contact) {
            setFormData(contact);
        } else {
            setFormData({ name: '', email: '', phone: '', trip: '', tags: [] });
        }
    }, [contact]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.phone) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name and Phone are required.',
            });
            return;
        }

        const newId = formData.id || Date.now().toString();
        const avatar = formData.avatar || `https://picsum.photos/seed/${newId}/40/40`;

        onSave({ ...formData, id: newId, avatar } as Contact);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                    <DialogDescription>
                        {contact ? 'Update the details for this contact.' : 'Enter the details for the new contact.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={handleChange} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="trip">Trip</Label>
                        <Input id="trip" value={formData.trip} onChange={handleChange} className="rounded-xl" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} className="rounded-full" size="lg">{contact ? 'Save Changes' : 'Add Contact'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UploadDialog({ open, onOpenChange, onUpload }: { open: boolean, onOpenChange: (open: boolean) => void, onUpload: (newContacts: Contact[]) => void }) {
    const { toast } = useToast();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Mock processing of CSV/XLSX
            // In a real app, use a library like 'papaparse' or 'xlsx'
            toast({
                title: "File Uploaded",
                description: `${file.name} is being processed. This is a mock action.`,
            });

            // Simulate adding a new contact from a file
            const newContact: Contact = {
                id: `csv-${Date.now()}`,
                name: "CSV User",
                phone: `+${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                email: "csv.user@example.com",
                trip: "From Upload",
                tags: ["uploaded"],
                avatar: `https://picsum.photos/seed/csv/40/40`
            };
            
            onUpload([newContact]);
            onOpenChange(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Contacts</DialogTitle>
                    <DialogDescription>Upload a CSV or XLSX file with contact information. Ensure columns for name and phone exist.</DialogDescription>
                </DialogHeader>
                <div className="p-4 text-center">
                    <Input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} className="rounded-xl" />
                    <p className="text-sm text-muted-foreground mt-2">Max file size: 5MB</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function ContactsPage() {
    const [contacts, setContacts] = React.useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = React.useState<Contact[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isContactDialogOpen, setContactDialogOpen] = React.useState(false);
    const [isUploadOpen, setUploadOpen] = React.useState(false);
    const [editingContact, setEditingContact] = React.useState<Contact | null>(null);

    React.useEffect(() => {
        const data = getContacts();
        setContacts(data);
        setFilteredContacts(data);
    }, []);

    React.useEffect(() => {
        const results = contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredContacts(results);
    }, [searchTerm, contacts]);

    const handleSaveContact = (contact: Contact) => {
        const updatedContacts = [...contacts];
        const existingIndex = updatedContacts.findIndex(c => c.id === contact.id);

        if (existingIndex > -1) {
            updatedContacts[existingIndex] = contact;
        } else {
            updatedContacts.unshift(contact);
        }
        setContacts(updatedContacts);
        saveContacts(updatedContacts);
    };

    const handleDeleteContact = (id: string) => {
        const updatedContacts = contacts.filter(c => c.id !== id);
        setContacts(updatedContacts);
        saveContacts(updatedContacts);
    };
    
    const handleUpload = (newContacts: Contact[]) => {
        const currentContacts = getContacts();
        const phones = new Set(currentContacts.map(c => c.phone));
        const uniqueNewContacts = newContacts.filter(nc => !phones.has(nc.phone));
        
        const updated = [...uniqueNewContacts, ...currentContacts];
        setContacts(updated);
        saveContacts(updated);
    };
    
    const handleExport = () => {
        // In a real app, this would be a CSV string from the data
        const csvContent = "data:text/csv;charset=utf-8,name,phone,email\n" + contacts.map(c => `${c.name},${c.phone},${c.email}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contacts.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

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
                     <Button size="lg" className="rounded-full" onClick={() => { setEditingContact(null); setContactDialogOpen(true); }}>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Add Contact
                    </Button>
                </div>
            </div>

             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setUploadOpen(true)}>
                        <File className="h-4 w-4 mr-2" />
                        Upload CSV
                    </Button>
                     <Button size="sm" className="rounded-full" disabled>
                        <Send className="h-4 w-4 mr-2" />
                        Send Campaign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContacts.map((contact) => (
                    <Card key={contact.id} className="group relative">
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
                                        <DropdownMenuItem onClick={() => { setEditingContact(contact); setContactDialogOpen(true); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem disabled>View conversation</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteContact(contact.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
            <ContactDialog open={isContactDialogOpen} onOpenChange={setContactDialogOpen} onSave={handleSaveContact} contact={editingContact} />
            <UploadDialog open={isUploadOpen} onOpenChange={setUploadOpen} onUpload={handleUpload} />
        </main>
    )
}
