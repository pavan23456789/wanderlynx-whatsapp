'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Loader,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { Campaign, CampaignMessage } from '@/lib/data';
import { format } from 'date-fns';

const statusConfig = {
  Sending: { variant: 'secondary', icon: Loader, className: 'animate-spin' },
  Pending: { variant: 'outline', icon: Clock },
  Completed: { variant: 'default', icon: CheckCircle, className: 'bg-blue-100 text-blue-800' },
  Draft: { variant: 'secondary', icon: FileText },
  Failed: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800' },
} as const;


export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchCampaign = React.useCallback(async () => {
    // Don't set loading to true on refetch to avoid flicker
    // setIsLoading(true); 
    try {
      const response = await fetch(`/api/campaigns/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch campaign details');
      }
      const data = await response.json();
      setCampaign(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast]);

  React.useEffect(() => {
    fetchCampaign();
    // Poll for updates if the campaign is active
    const interval = setInterval(() => {
        // Use a function form of setCampaign to get the latest state
        // This avoids stale closure issues with `campaign` state variable.
        setCampaign(currentCampaign => {
            if(currentCampaign && (currentCampaign.status === 'Sending' || currentCampaign.status === 'Draft')) {
                fetchCampaign();
            }
            return currentCampaign;
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCampaign]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader className="h-8 w-8 animate-spin" /></div>;
  }

  if (!campaign) {
    return <div className="text-center p-10">Campaign not found.</div>;
  }

  const config = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.Draft;
  const Icon = config.icon;

  const progress = campaign.audienceCount > 0 ? ((campaign.sent + campaign.failed) / campaign.audienceCount) * 100 : 0;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-3xl font-bold tracking-tight">
          {campaign.name}
        </h1>
        <Badge variant={config.variant as any} className={`ml-auto sm:ml-0 flex items-center ${config.className || ''}`}>
          <Icon className={`h-4 w-4 mr-2 ${config.className || ''}`} />
          {campaign.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.status}</div>
            <p className="text-xs text-muted-foreground truncate">
              {campaign.statusMessage}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audience</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.audienceCount}</div>
            <p className="text-xs text-muted-foreground">Total contacts targeted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.sent + campaign.failed} / {campaign.audienceCount}</div>
             <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Template Used</CardTitle>
            <CardDescription>{campaign.templateName}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="p-4 bg-secondary rounded-2xl">
                 <p className="text-muted-foreground text-sm">Content:</p>
                 <p className="whitespace-pre-wrap">{campaign.templateContent}</p>
             </div>
             {campaign.variables && Object.keys(campaign.variables).length > 0 && (
                <div className="mt-4">
                    <h4 className="font-medium mb-2">Variables Used:</h4>
                    <div className="space-y-2 text-sm">
                        {Object.entries(campaign.variables).map(([key, value]) => (
                             <div key={key} className="flex items-center">
                                <span className="font-mono text-muted-foreground bg-secondary/50 rounded-md px-2 py-1 mr-2">{`{{${key}}}`}</span>
                                <span>{value as string}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Delivery Stats</CardTitle>
             </CardHeader>
             <CardContent className="grid gap-4">
                <div className="flex items-center">
                    <div>Sent</div>
                    <div className="font-semibold ml-auto">{campaign.sent}</div>
                </div>
                <div className="flex items-center">
                    <div>Failed</div>
                    <div className="font-semibold ml-auto">{campaign.failed}</div>
                </div>
                <div className="flex items-center">
                    <div>Pending</div>
                    <div className="font-semibold ml-auto">{campaign.audienceCount - campaign.sent - campaign.failed}</div>
                </div>
             </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Message Log</CardTitle>
                <CardDescription>
                    Status of each message sent in this campaign.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contact</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaign.messages && campaign.messages.length > 0 ? campaign.messages.map((msg: CampaignMessage) => (
                             <TableRow key={msg.contactId}>
                                <TableCell>{msg.contactId}</TableCell>
                                <TableCell>
                                     <Badge variant={msg.status === 'Failed' ? 'destructive' : 'secondary'}>
                                        {msg.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{msg.error || '-'}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {msg.timestamp ? format(new Date(msg.timestamp), "Pp") : '-'}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">No messages logged for this campaign yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
       </Card>
    </main>
  );
}