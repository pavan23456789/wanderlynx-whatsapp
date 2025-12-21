'use client';

import * as React from 'react';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  React.useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

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
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading logs...</div>
          ) : error ? (
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
                        const config = statusConfig[log.status];
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
