'use client';
// ⚠️ IMPORTANT:
// Scrolling for this page is intentionally handled here.
// Do NOT move overflow or height logic to dashboard/layout.tsx.
// Doing so breaks Inbox and Chat layouts.

import * as React from 'react';
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  PlusCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Template } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ⚠️ This page manages TEMPLATE state only.
// Do not reuse Contact or Campaign selection logic here.

const statusConfig = {
  Approved: {
    variant: 'default',
    icon: CheckCircle,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  Pending: {
    variant: 'secondary',
    icon: Clock,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
  Rejected: {
    variant: 'destructive',
    icon: XCircle,
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
} as const;

function TemplatePreviewDialog({ template, open, onOpenChange }: { template: Template | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!template) return null;
    const config = statusConfig[template.status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">{template.name}</DialogTitle>
                    <DialogDescription>
                        Read-only preview of this message template.
                    </DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center">
                        <Badge variant="outline">{template.category}</Badge>
                         <Badge variant={config.variant as any} className={`flex items-center gap-2 ${config.className}`}>
                            <Icon className="h-4 w-4" />
                            <span>{template.status}</span>
                        </Badge>
                    </div>
                     <div className="p-4 bg-secondary rounded-2xl">
                        <p className="text-sm text-muted-foreground">Template Content:</p>
                        <p className="whitespace-pre-wrap">{template.content}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = React.useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  React.useEffect(() => {
    async function fetchTemplates() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/templates');
            if (!response.ok) {
                throw new Error('Failed to fetch templates');
            }
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
            // Optionally, show a toast notification
        } finally {
            setIsLoading(false);
        }
    }
    fetchTemplates();
  }, []);

  React.useEffect(() => {
    const results = templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(results);
  }, [searchTerm, templates]);

  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Message Templates</h1>
            <p className="text-muted-foreground">
              A read-only view of templates synced from WhatsApp Business Manager.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button size="lg" className="rounded-full" disabled>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Template
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Templates are managed in WhatsApp Business Manager.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="rounded-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              suppressHydrationWarning={true}
            />
          </div>
        </div>

        {isLoading
            ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="flex flex-col">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Skeleton className="mb-2 h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                        </Card>
                    ))}
                </div>
            )
            : filteredTemplates.length === 0
            ? (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">No templates found</h3>
                    <p className="mt-1 text-sm">Templates are created and approved in WhatsApp Business Manager.</p>
                </div>
            )
            : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => {
                        const config =
                        statusConfig[template.status] ||
                        statusConfig.Pending;
                        const Icon = config.icon;
                        return (
                        <Card
                            key={template.id}
                            className="group relative flex cursor-pointer flex-col"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-secondary p-3">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">{template.name}</CardTitle>
                                    <CardDescription>{template.category}</CardDescription>
                                </div>
                                </div>
                                <Badge
                                variant={config.variant as any}
                                className={`flex items-center gap-2 ${config.className}`}
                                >
                                <Icon className="h-4 w-4" />
                                <span>{template.status}</span>
                                </Badge>
                            </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                            <p className="line-clamp-3 text-muted-foreground">
                                {template.content}
                            </p>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            )}
        <TemplatePreviewDialog template={selectedTemplate} open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)} />
      </main>
    </TooltipProvider>
  );
}
