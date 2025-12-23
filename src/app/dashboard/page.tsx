'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Users,
  MessageSquare,
  Send,
  ScrollText,
  AlertTriangle,
} from 'lucide-react';
import type { Conversation } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { mockDashboardStats, chartdata, type DashboardStats } from '@/lib/mock/mockDashboard';

const StatCardSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call with mock data
    setTimeout(() => {
        // To test error state, uncomment the following line:
        // setError("Failed to connect to the server. Please check your connection and try again.");
        
        // To test with data:
        setStats(mockDashboardStats);
        
        // To test empty state, uncomment the following line:
        // setStats({ totalContacts: 0, activeCampaigns: 0, totalTemplates: 0, recentConversations: [], messagesSent: 0 });
        
        setIsLoading(false);
    }, 1000);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[350px] w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                         <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                             <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="grid gap-1 flex-1">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  if (error || !stats) {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10">
            <Card className="max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 p-3 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Could Not Load Dashboard</CardTitle>
                    <CardDescription>{error || "There was a problem retrieving data from the backend."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={fetchData} className="rounded-full">Retry</Button>
                </CardContent>
            </Card>
        </main>
      );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contacts
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              Total contacts in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Messages Sent
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messagesSent.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Via all campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <Send className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-sm text-muted-foreground">
              Currently sending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTemplates}</div>
            <p className="text-sm text-muted-foreground">
              Approved message templates
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>
              Total messages sent and received in the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartdata}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', radius: 'var(--radius)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderRadius: 'var(--radius)',
                    border: '0',
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="messages"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Your most recent chats.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {stats.recentConversations.length > 0 ? (
                stats.recentConversations.map((convo: Conversation) => (
                    <Link href="/dashboard/inbox" key={convo.id} className="flex items-center gap-4 hover:bg-secondary p-2 rounded-lg -m-2">
                        <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                            <AvatarImage src={convo.avatar} alt="Avatar" />
                            <AvatarFallback>{convo.name?.substring(0, 2) || '??'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1 flex-1 overflow-hidden">
                            <p className="text-base font-medium leading-none truncate">{convo.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                        </div>
                    </Link>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm font-medium">No recent conversations</p>
                    <p className="text-xs">When a customer messages you, it will appear here.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
