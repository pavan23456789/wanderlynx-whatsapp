'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { LogEntry } from '@/lib/logger';
import {
  CheckCircle,
  XCircle,
  SkipForward,
  AlertTriangle,
  Lock,
  Zap,
  BarChart3,
  RefreshCcw,
  Search
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { getCurrentUser, User } from '@/lib/auth';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// GEMINI FIX: Import authFetch to pass Middleware 401 checks
import { authFetch } from '@/utils/api-client';

const statusConfig = {
  SUCCESS: {
    variant: 'default',
    icon: CheckCircle,
    label: 'Success',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  FAILURE: {
    variant: 'destructive',
    icon: AlertTriangle,
    label: 'Failure',
     className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
  SKIPPED: {
    variant: 'secondary',
    icon: SkipForward,
    label: 'Skipped',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  },
} as const;

export default function LogsPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // USAGE TRACKER STATE (NEW A-Z FIX)
  const [apiStats, setApiStats] = React.useState({ total: 0, last24h: 0 });

  const loadPageData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Await the user data properly (Fixes image_c06076.png)
      const user = await getCurrentUser();
      setCurrentUser(user);

      // 2. Only fetch data if the user is verified as Super Admin
      if (user?.role === 'Super Admin') {
        // Fetch standard logs
        const response = await authFetch('/api/logs'); 
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);

        // Fetch Usage Tracker stats for the cards
        const statsRes = await authFetch('/api/stats/usage');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setApiStats(stats);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Filtering Logic for large datasets
  const filteredLogs = logs.filter(log => 
    log.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.event?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Synchronizing Logs & Usage Tracker...</p>
        </div>
      );
  }

  if (!currentUser || currentUser.role !== 'Super Admin') {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10 text-center">
            <Lock className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">Access Restricted</h1>
            <p className="max-w-[400px] text-muted-foreground">
                Administrative privileges are required to view technical event logs and API usage metrics.
            </p>
            <Button asChild className="rounded-full">
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </main>
      )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Logs & API Tracker</h1>
          <p className="text-muted-foreground">
            Monitoring message delivery status and partner tool activity.
          </p>
        </div>
        <Button onClick={() => loadPageData()} variant="outline" size="sm" className="rounded-full gap-2">
          <RefreshCcw className="h-4 w-4" /> Refresh Data
        </Button>
      </div>

      {/* USAGE TRACKER CARDS (A-Z FIX) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total API Requests</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{apiStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime messages from external tool</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{apiStats.last24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully synced messages today</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                Detailed technical stream of the last 1000 events.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by recipient or event..."
                className="pl-8 rounded-full bg-secondary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center p-10 bg-destructive/10 rounded-2xl text-destructive border border-destructive/20">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p className="font-semibold">{error}</p>
              <Button onClick={() => loadPageData()} variant="link" className="mt-2">Try again</Button>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
                <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="hidden md:table-cell">Details</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredLogs.length > 0 ? filteredLogs.map((log, index) => {
                        const config = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.FAILURE;
                        const Icon = config.icon;
                        return (
                            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <Badge variant={config.variant as any} className={cn("rounded-full font-medium px-2.5 py-0.5", config.className)}>
                                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-sm">{log.event}</TableCell>
                                <TableCell className="text-sm font-mono">{log.recipient}</TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-md">
                                    <span className="truncate block">
                                      {log.error ? log.error : log.details?.message || `Template ID: ${log.details?.template || 'N/A'}`}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                                     <div className="font-medium text-foreground">
                                       {format(new Date(log.timestamp), 'HH:mm:ss')}
                                     </div>
                                     <div className="text-[10px]">
                                       {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                     </div>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                              No log entries found matching your search.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}