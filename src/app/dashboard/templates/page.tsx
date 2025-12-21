'use client';

import * as React from 'react';
import { Search, FileText, CheckCircle, Clock, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Template } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';


const statusConfig = {
    Approved: { variant: "default", icon: CheckCircle, className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    Pending: { variant: "secondary", icon: Clock, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
    Rejected: { variant: "destructive", icon: XCircle, className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
} as const;

export default function TemplatesPage() {
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [filteredTemplates, setFilteredTemplates] = React.useState<Template[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const fetchTemplates = React.useCallback(async () => {
        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    React.useEffect(() => {
        const results = templates.filter(template =>
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTemplates(results);
    }, [searchTerm, templates]);

    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Message Templates</h1>
                    <p className="text-muted-foreground">
                        A read-only view of templates synced from WhatsApp Business Manager.
                    </p>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search templates..." className="pl-10 rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="flex flex-col">
                            <CardHeader>
                                <Skeleton className="h-6 w-1/2" />
                                <Skeleton className="h-4 w-1/4" />
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </CardContent>
                        </Card>
                    ))
                 ) : filteredTemplates.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        No templates found.
                    </div>
                 ) : filteredTemplates.map((template) => {
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
                                    <Badge variant={config.variant as any} className={`flex items-center gap-2 ${config.className}`}>
                                        <Icon className="h-4 w-4" />
                                        <span>{template.status}</span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-muted-foreground line-clamp-3">{template.content}</p>
                            </CardContent>
                        </Card>
                     )
                })}
            </div>
        </main>
    )
}
