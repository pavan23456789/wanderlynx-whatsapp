import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    ArrowUpRight,
} from "lucide-react"

const chartdata = [
    { name: "Mon", messages: 186 },
    { name: "Tue", messages: 305 },
    { name: "Wed", messages: 237 },
    { name: "Thu", messages: 273 },
    { name: "Fri", messages: 209 },
    { name: "Sat", messages: 214 },
    { name: "Sun", messages: 345 },
]

const recentConversations = [
    {
        name: "Olivia Martin",
        email: "olivia.martin@email.com",
        avatar: "https://picsum.photos/seed/1/40/40",
        lastMessage: "Can you confirm my trip details?",
        time: "5m ago",
    },
    {
        name: "Jackson Lee",
        email: "jackson.lee@email.com",
        avatar: "https://picsum.photos/seed/2/40/40",
        lastMessage: "Thanks for the update!",
        time: "10m ago",
    },
    {
        name: "Isabella Nguyen",
        email: "isabella.nguyen@email.com",
        avatar: "https://picsum.photos/seed/3/40/40",
        lastMessage: "My flight was rescheduled.",
        time: "1h ago",
    },
    {
        name: "William Kim",
        email: "will@email.com",
        avatar: "https://picsum.photos/seed/4/40/40",
        lastMessage: "Perfect!",
        time: "2h ago",
    },
]

export default function DashboardPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,254</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">+2 since last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">28</div>
                        <p className="text-xs text-muted-foreground">+5 approved this month</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Message Volume</CardTitle>
                        <CardDescription>
                            Total messages sent and received in the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                                />
                                <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Conversations</CardTitle>
                        <CardDescription>
                            You have 12 unread messages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8">
                        {recentConversations.map((convo, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <Avatar className="hidden h-9 w-9 sm:flex" data-ai-hint="person portrait">
                                    <AvatarImage src={convo.avatar} alt="Avatar" />
                                    <AvatarFallback>{convo.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">{convo.name}</p>
                                    <p className="text-sm text-muted-foreground">{convo.lastMessage}</p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">{convo.time}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
