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
  Users,
  MessageSquare,
  Send,
  ScrollText,
  Loader,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Frontend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [stats, setStats] = React.useState({
    contacts: 0,
    messages: 0,
    templates: 0,
    activeCampaigns: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Get Contact Count
        const { count: contactCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true });

        // 2. Get Message Count
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });

        // 3. Get Template Count
        const { count: templateCount } = await supabase
          .from('templates')
          .select('*', { count: 'exact', head: true });

        setStats({
          contacts: contactCount || 0,
          messages: messageCount || 0,
          templates: templateCount || 0,
          activeCampaigns: 0, // Campaigns table coming soon
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
      return <div className="flex h-full items-center justify-center p-10"><Loader className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* CONTACTS CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.contacts}</div>
            <p className="text-sm text-muted-foreground">Total contacts in CRM</p>
          </CardContent>
        </Card>

        {/* MESSAGES CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Processed</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messages}</div>
            <p className="text-sm text-muted-foreground">Sent & Received</p>
          </CardContent>
        </Card>

        {/* CAMPAIGNS CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Send className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-sm text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        {/* TEMPLATES CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.templates}</div>
            <p className="text-sm text-muted-foreground">Synced from Meta</p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTIONS / EMPTY STATE */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="md:col-span-2 bg-secondary/20 border-dashed">
            <CardHeader>
                <CardTitle>Welcome to Wanderlynx</CardTitle>
                <CardDescription>Select a module from the sidebar to get started.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Link href="/dashboard/inbox" className="text-sm font-medium text-primary hover:underline">Go to Inbox &rarr;</Link>
                <Link href="/dashboard/contacts" className="text-sm font-medium text-primary hover:underline">Manage Contacts &rarr;</Link>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}