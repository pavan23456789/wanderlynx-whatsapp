'use client';

import * as React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip
} from "recharts"
import {
    Users,
    MessageSquare,
    Send,
    ScrollText,
} from "lucide-react"
import { getContacts, getCampaigns, getTemplates, getConversations, Conversation } from '@/lib/data';

const chartdata = [
    { name: "Mon", messages: 186 },
    { name: "Tue", messages: 305 },
    { name: "Wed", messages: 237 },
    { name: "Thu", messages: 273 },
    { name: "Fri", messages: 209 },
    { name: "Sat", messages: 214 },
    { name: "Sun", messages: 345 },
]

export default function DashboardPage() {
    const [totalContacts, setTotalContacts] = React.useState(0);
    const [activeCampaigns, setActiveCampaigns] = React.useState(0);
    const [totalTemplates, setTotalTemplates] = React.useState(0);
    const [recentConversations, setRecentConversations] = React.useState<Conversation[]>([]);
    
    React.useEffect(() => {
        setTotalContacts(getContacts().length);
        setActiveCampaigns(getCampaigns().filter(c => c.status === 'Delivering' || c.status === 'Scheduled').length);
        setTotalTemplates(getTemplates().length);
        setRecentConversations(getConversations().slice(0, 4));
    }, []);


    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalContacts}</div>
                        <p className="text-sm text-muted-foreground">Total contacts in the system</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">2,350</div>
                        <p className="text-sm text-muted-foreground">(Mock Data)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                        <Send className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeCampaigns}</div>
                        <p className="text-sm text-muted-foreground">Currently running or scheduled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                        <ScrollText className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalTemplates}</div>
                        <p className="text-sm text-muted-foreground">Total message templates</p>
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
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                                    }}
                                />
                                <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Conversations</CardTitle>
                        <CardDescription>
                            Your most recent chats.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {recentConversations.map((convo, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10" data-ai-hint="person portrait">
                                    <AvatarImage src={convo.avatar} alt="Avatar" />
                                    <AvatarFallback>{convo.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-base font-medium leading-none">{convo.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-muted-foreground">{convo.time}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
