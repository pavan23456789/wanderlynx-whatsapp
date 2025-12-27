'use client';
// ⚠️ SCROLLING INVARIANT
// Scrolling is intentionally handled at the PAGE level.

import * as React from 'react';
import {
  File,
  PlusCircle,
  MoreHorizontal,
  Search,
  Users,
  Loader,
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

// --- COMPONENTS ---

function ContactDialog({
  open,
  onOpenChange,
  onSave,
  contact,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Partial<Contact>, isUpdate: boolean) => void;
  contact: Contact | null;
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<Partial<Contact>>({});

  React.useEffect(() => {
    if (contact) {
      setFormData(contact);
    } else {
      setFormData({ id: undefined, name: '', email: '', phone: '', trip: '', tags: [] });
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

    const isUpdate = !!formData.id;
    onSave(formData, isUpdate);
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
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="rounded-xl"
              suppressHydrationWarning={true}
              disabled={!canEdit || !!contact} // Cannot edit phone for existing contact
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
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = React.useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isContactDialogOpen, setContactDialogOpen] = React.useState(false);
  const [isUploadOpen, setUploadOpen] = React.useState(false);
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const fetchContacts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  React.useEffect(() => {
    const results = contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone &&
          contact.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContacts(results);
  }, [searchTerm, contacts]);

  const handleSaveContact = async (contactData: Partial<Contact>, isUpdate: boolean) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contactData, isUpdate }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save contact');
      }
      toast({ title: 'Success', description: `Contact ${isUpdate ? 'updated' : 'created'}.` });
      setContactDialogOpen(false);
      fetchContacts(); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  const handleDeleteContact = (id: string) => {
    // Mock delete for now as we don't want to accidentally delete conversations
    toast({ title: 'Contact Deleted (Mock)', description: 'To delete a contact, archive their conversation.'});
  };

  const handleUpload = (count: number) => {
    console.log(`Uploaded ${count} contacts.`);
    fetchContacts();
  };

  // --- RBAC ---
  const canCreate = currentUser?.role === 'Super Admin';
  const canUpload = currentUser?.role === 'Super Admin' || currentUser?.role === 'Marketing';
  const canEdit = currentUser?.role !== 'Customer Support';
  const canDelete = currentUser?.role === 'Super Admin';
  
  if (isLoading || !currentUser) {
    return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
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
            <Card key={contact.id} className="group relative cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedContact(contact)}>
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
                         {!canEdit && <TooltipContent><p>Only Admins and Marketing can edit.</p></TooltipContent>}
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