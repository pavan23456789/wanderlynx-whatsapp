'use client';
// ⚠️ SCROLLING INVARIANT
// Scrolling is intentionally handled at the PAGE level.
// DO NOT move overflow / height logic to dashboard layout.
// Changing global layout will break Inbox & Chat.

import * as React from 'react';
import {
  File,
  PlusCircle,
  MoreHorizontal,
  Search,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Contact } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { getCurrentUser, User } from '@/lib/auth';

const mockContacts: Contact[] = [
    { id: '1', name: 'Olivia Martin', email: 'olivia.martin@email.com', phone: '+14155552671', trip: 'Bali Adventure', tags: ['vip', 'new'], avatar: 'https://picsum.photos/seed/1/80/80' },
    { id: '2', name: 'Liam Anderson', email: 'liam.anderson@email.com', phone: '+12125551234', trip: 'Thai Beaches', tags: [], avatar: 'https://picsum.photos/seed/2/80/80' },
];

function ContactDialog({
  open,
  onOpenChange,
  onSave,
  contact,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Contact) => void;
  contact: Contact | null;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<Contact>>({});

  React.useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({ name: '', email: '', phone: '', trip: '', tags: [] });
    }
  }, [contact, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    if (!canEdit) {
        toast({ variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    if (!formData.name || !formData.phone) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name and Phone are required.',
      });
      return;
    }

    const newId = formData.id || formData.phone || Date.now().toString();
    const avatar =
      formData.avatar || `https://picsum.photos/seed/${newId}/40/40`;

    onSave({ ...formData, id: newId, avatar } as Contact);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {contact
              ? 'Update the details for this contact.'
              : 'Enter the details for the new contact.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="rounded-xl"
              suppressHydrationWarning={true}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="rounded-xl"
              suppressHydrationWarning={true}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="rounded-xl"
              suppressHydrationWarning={true}
              disabled={!canEdit}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="rounded-full" size="lg" disabled={!canEdit}>
            {contact ? 'Save Changes' : 'Add Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (count: number) => void;
}) {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock action
      const mockContactCount = Math.floor(Math.random() * 50) + 10;
      onUpload(mockContactCount);
      toast({
        title: 'Import Successful (Mock)',
        description: `Imported ${mockContactCount} new contacts.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file. Ensure columns for name and phone exist.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 text-center">
          <Input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} className="rounded-xl" />
          <p className="mt-2 text-sm text-muted-foreground">Max file size: 5MB</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ContactDetailPanel({ contact, open, onOpenChange, canEdit }: { contact: Contact | null, open: boolean, onOpenChange: (open: boolean) => void, canEdit: boolean }) {
    if (!contact) return null;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16" data-ai-hint="person portrait">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-2xl">{contact.name}</SheetTitle>
                            <SheetDescription>{contact.phone}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <h3 className="font-semibold text-lg">Details</h3>
                    <div className="grid gap-3 text-sm">
                        <div className="grid grid-cols-3 items-center">
                            <span className="text-muted-foreground">Email</span>
                            <span className="col-span-2">{contact.email || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <span className="text-muted-foreground">Trip</span>
                            <span className="col-span-2">{contact.trip || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <span className="text-muted-foreground">Tags</span>
                            <div className="col-span-2 flex flex-wrap gap-2">
                                {contact.tags && contact.tags.length > 0 ? contact.tags.map(tag => (
                                    <Badge key={tag} variant={tag === 'vip' ? 'destructive' : 'secondary'}>{tag}</Badge>
                                )) : <span className="text-muted-foreground">-</span>}
                            </div>
                        </div>
                    </div>
                </div>
                 <SheetFooter className="p-6 border-t bg-background">
                     <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button variant="outline" className="w-full rounded-full" disabled={!canEdit}>
                                        Edit Contact
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!canEdit && <TooltipContent><p>Only Admins and Marketing can edit contacts.</p></TooltipContent>}
                         </Tooltip>
                     </TooltipProvider>
                 </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>(mockContacts);
  const [filteredContacts, setFilteredContacts] = React.useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isContactDialogOpen, setContactDialogOpen] = React.useState(false);
  const [isUploadOpen, setUploadOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  React.useEffect(() => {
    const results = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone &&
          contact.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const handleSaveContact = (contactData: Contact) => {
    setContacts((prev) => {
      const isUpdate = prev.some((c) => c.id === contactData.id);
      if (isUpdate) {
        toast({ title: 'Success', description: 'Contact updated.' });
        return prev.map((c) => (c.id === contactData.id ? contactData : c));
      } else {
        toast({ title: 'Success', description: 'Contact created.' });
        return [contactData, ...prev];
      }
    });
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Contact Deleted', description: 'The contact has been removed (UI-only).'});
  };

  const handleUpload = (count: number) => {
    // This is a mock implementation
    console.log(`Uploaded ${count} contacts.`);
  };

  // --- RBAC ---
  const canCreate = currentUser?.role === 'Super Admin';
  const canUpload = currentUser?.role === 'Super Admin' || currentUser?.role === 'Marketing';
  const canEdit = currentUser?.role === 'Super Admin';
  const canDelete = currentUser?.role === 'Super Admin';
  
  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <TooltipProvider>
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and their information.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tooltip>
              <TooltipTrigger asChild>
                  <div className="relative">
                      <Button
                        size="lg"
                        className="rounded-full"
                        onClick={() => {
                          setEditingContact(null);
                          setContactDialogOpen(true);
                        }}
                        disabled={!canCreate}
                      >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add Contact
                      </Button>
                  </div>
              </TooltipTrigger>
              {!canCreate && <TooltipContent><p>Only Admins can create contacts.</p></TooltipContent>}
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="rounded-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            suppressHydrationWarning={true}
          />
        </div>
        <div className="flex items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => setUploadOpen(true)}
                        disabled={!canUpload}
                      >
                        <File className="mr-2 h-4 w-4" />
                        Upload CSV
                      </Button>
                    </div>
                </TooltipTrigger>
                {!canUpload && <TooltipContent><p>Only Admins and Marketing can upload contacts.</p></TooltipContent>}
            </Tooltip>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="py-20 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No contacts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add a contact or import a CSV to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="group relative cursor-pointer" onClick={() => setSelectedContact(contact)}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <Avatar
                  className="mb-4 h-24 w-24"
                  data-ai-hint="person portrait"
                >
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{contact.name}</h3>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                 <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {contact.tags.map((tag) => (
                        <Badge key={tag} variant={tag === 'vip' ? 'destructive' : 'secondary'}>{tag}</Badge>
                    ))}
                </div>
              </CardContent>
              <div className="absolute right-4 top-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-haspopup="true"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl" onClick={e => e.stopPropagation()}>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="w-full">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setContactDialogOpen(true);
                                  }}
                                  disabled={!canEdit}
                                >
                                  Edit
                                </DropdownMenuItem>
                            </div>
                        </TooltipTrigger>
                         {!canEdit && <TooltipContent><p>Only Admins can edit contacts.</p></TooltipContent>}
                    </Tooltip>
                    <Tooltip>
                         <TooltipTrigger asChild>
                            <div className="w-full">
                                <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={!canDelete}
                                >
                                Delete
                                </DropdownMenuItem>
                            </div>
                        </TooltipTrigger>
                        {!canDelete && <TooltipContent><p>Only Admins can delete contacts.</p></TooltipContent>}
                    </Tooltip>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSave={handleSaveContact}
        contact={editingContact}
        canEdit={canEdit}
      />
      <UploadDialog
        open={isUploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
      />
      <ContactDetailPanel contact={selectedContact} open={!!selectedContact} onOpenChange={() => setSelectedContact(null)} canEdit={canEdit} />
    </main>
    </TooltipProvider>
  );
}
