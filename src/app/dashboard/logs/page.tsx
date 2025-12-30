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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentUser, User } from '@/lib/auth';
import { Button } from '@/components/ui/button';
// GEMINI FIX: Added authFetch to pass Middleware 401 checks
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

  // GEMINI FIX: Correctly handling the Async nature of getCurrentUser to solve "Access Restricted"
  React.useEffect(() => {
    async function loadPageData() {
      setIsLoading(true);
      try {
        // 1. Await the user data properly (Fixes image_c06076.png)
        const user = await getCurrentUser();
        setCurrentUser(user);

        // 2. Only fetch logs if the user is verified as Super Admin
        if (user?.role === 'Super Admin') {
          const response = await authFetch('/api/logs'); // Use authFetch to fix 401
          if (!response.ok) {
            throw new Error('Failed to fetch logs from server');
          }
          const data = await response.json();
          setLogs(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPageData();
  }, []);

  if (isLoading) {
      return <div className="p-10 text-center flex items-center justify-center gap-2">
        <Lock className="animate-pulse h-5 w-5" />
        Loading Event Logs...
      </div>
  }

  // Final Guard: If data is loaded but user is still not Admin
  if (!currentUser || currentUser.role !== 'Super Admin') {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10 text-center">
            <Lock className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-3xl font-bold">Access Restricted</h1>
            <p className="text-muted-foreground">
                Only Admins can view event logs.
            </p>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </main>
      )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Logs</h1>
          <p className="text-muted-foreground">
            A real-time stream of incoming events and message delivery status.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>
            Showing the last 1000 processed events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center text-destructive">{error}</div>
          ) : (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? logs.map((log, index) => {
                        const config = statusConfig[log.status as keyof typeof statusConfig];
                        const Icon = config.icon;
                        return (
                            <TableRow key={index}>
                                <TableCell>
                                    <Badge variant={config.variant as any} className={config.className}>
                                        <Icon className="h-4 w-4 mr-2" />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{log.event}</TableCell>
                                <TableCell>{log.recipient}</TableCell>
                                <TableCell className="text-muted-foreground text-xs max-w-sm truncate">
                                    {log.error ? log.error : log.details?.message || `Template: ${log.details?.template}`}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                     {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">No logs found.</TableCell>
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