'use client';

import * as React from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Template } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";


const statusConfig = {
    Approved: { variant: "default", icon: CheckCircle },
    Pending: { variant: "secondary", icon: Clock },
    Rejected: { variant: "destructive", icon: XCircle },
} as const;

function TemplateDialog({ open, onOpenChange, onSave, template }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (template: Template) => void, template: Template | null }) {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState<Partial<Template>>({});

    React.useEffect(() => {
        if (template) {
            setFormData(template);
        } else {
            setFormData({ name: '', category: 'Marketing', content: '', status: 'Pending' });
        }
    }, [template]);

    const handleSave = () => {
        if (!formData.name || !formData.content) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Template name and content are required.",
            });
            return;
        }

        const newId = formData.id || `TPL${Date.now()}`;
        onSave({ ...formData, id: newId, status: formData.status || 'Pending' } as Template);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{template ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                    <DialogDescription>
                       Templates must be approved by Meta before they can be used in campaigns.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Template Name</Label>
                        <Input id="name" value={formData.name || ''} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s/g, '_') }))} className="rounded-xl" placeholder="e.g., welcome_message" />
                         <p className="text-xs text-muted-foreground">Must be lowercase and contain only letters, numbers, and underscores.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value: any) => setFormData(p => ({ ...p, category: value }))}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Utility">Utility</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Message Body</Label>
                        <Textarea id="content" value={formData.content || ''} onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))} className="rounded-2xl" rows={5} placeholder="Hello {{1}}! Welcome to our service." />
                        <p className="text-xs text-muted-foreground">Use `{{1}}`, `{{2}}` for variables.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} className="rounded-full" size="lg">{template ? 'Save Changes' : 'Submit for Approval'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function TemplatesPage() {
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [filteredTemplates, setFilteredTemplates] = React.useState<Template[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isDialogOpen, setDialogOpen] = React.useState(false);
    const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null);
    const { toast } = useToast();

    const fetchTemplates = React.useCallback(async () => {
        try {
            const response = await fetch('/api/templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                throw new Error('Failed to fetch templates');
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    }, [toast]);

    React.useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    React.useEffect(() => {
        const results = templates.filter(template =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTemplates(results);
    }, [searchTerm, templates]);

    const handleSaveTemplate = async (template: Template) => {
         try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Template saved.' });
                fetchTemplates();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save template');
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    const handleDeleteTemplate = (id: string) => {
        // Implement backend deletion if needed
        console.log("Delete template:", id);
    };

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
                     <Button size="lg" className="rounded-full" onClick={() => { setEditingTemplate(null); setDialogOpen(true); }}>
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Create Template
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search templates..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredTemplates.map((template) => {
                     const config = statusConfig[template.status as keyof typeof statusConfig] || statusConfig.Pending;
                     const Icon = config.icon;
                     return (
                        <Card key={template.id} className="group flex flex-col relative">
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
                                        <DropdownMenuItem onClick={() => { setEditingTemplate(template); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                     )
                })}
            </div>
            <TemplateDialog open={isDialogOpen} onOpenChange={setDialogOpen} onSave={handleSaveTemplate} template={editingTemplate} />
        </main>
    )
}
