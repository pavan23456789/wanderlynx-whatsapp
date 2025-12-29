'use client';

import * as React from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
// 1. Remove getTeamMembers from here
import { getCurrentUser, User } from '@/lib/auth'; 
import { Lock, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // 2. Add Supabase

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<User | null>(null);
    const [teamMembers, setTeamMembers] = React.useState<any[]>([]); // Changed type to accept DB rows
    const [isLoading, setIsLoading] = React.useState(true);
    
    // Automation States
    const [welcomeMessage, setWelcomeMessage] = React.useState("Thanks for contacting Wanderlynx! An agent will be with you shortly.");
    const [isWelcomeEnabled, setWelcomeEnabled] = React.useState(true);

    React.useEffect(() => {
        async function loadData() {
            // 1. Load Current User
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            // 2. If Admin, Load Team from Database
            if (currentUser?.role === 'Super Admin') {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*');
                
                if (data) {
                    setTeamMembers(data);
                } else if (error) {
                    console.error("Error loading team:", error);
                }
            }
            
            // 3. Load Automations (Simulated for now, can be moved to DB later)
            const savedEnabled = localStorage.getItem('automations_welcome_enabled');
            const savedMessage = localStorage.getItem('automations_welcome_message');
            if (savedEnabled !== null) setWelcomeEnabled(JSON.parse(savedEnabled));
            if (savedMessage !== null) setWelcomeMessage(savedMessage);

            setIsLoading(false);
        }
        loadData();
    }, []);

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your profile information has been updated.",
        });
    };

    const handleSaveAutomations = () => {
        localStorage.setItem('automations_welcome_enabled', JSON.stringify(isWelcomeEnabled));
        localStorage.setItem('automations_welcome_message', welcomeMessage);
        toast({
            title: "Automations Saved",
            description: "Your automation settings have been updated.",
        });
    };
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
    }

    if (!user) {
        return <div>Error loading user profile.</div>;
    }

    // RBAC check: Lock out non-Admins
    if (user.role !== 'Super Admin') {
        return (
             <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10 text-center">
                <Lock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-3xl font-bold">Access Restricted</h1>
                <p className="text-muted-foreground">
                    Only Admins can access the settings page.
                </p>
                <Button asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </main>
        )
    }

    return (
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
                <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="automations">Automations</TabsTrigger>
                        {user.role === 'Super Admin' && <TabsTrigger value="team">Team</TabsTrigger>}
                    </TabsList>
                    
                    {/* ACCOUNT TAB */}
                    <TabsContent value="account">
                        <Card className="max-w-4xl">
                            <CardHeader>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>
                                    Manage your profile information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex items-center gap-6">
                                     <Avatar className="h-24 w-24">
                                        <AvatarImage src={user.avatar} data-ai-hint="person portrait" />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" className="rounded-full" disabled>Change Photo</Button>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue={user.name} className="rounded-xl" suppressHydrationWarning={true} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue={user.email} className="rounded-xl" readOnly suppressHydrationWarning={true} />
                                    </div>
                                </div>
                                 <div className="space-y-2 max-w-sm">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input id="password" type="password" className="rounded-xl" placeholder="••••••••" suppressHydrationWarning={true} />
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveChanges}>Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* AUTOMATIONS TAB */}
                    <TabsContent value="automations">
                         <Card className="max-w-4xl">
                            <CardHeader>
                                <CardTitle>Automations</CardTitle>
                                <CardDescription>
                                    Configure automatic replies and actions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex items-center justify-between rounded-2xl p-6 shadow-sm bg-secondary/50">
                                    <div className="space-y-1">
                                        <Label htmlFor="welcome-message" className="text-base font-semibold">
                                            Automatic Welcome Message
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Send a reply automatically on the first message from a new contact.
                                        </p>
                                    </div>
                                    <Switch id="welcome-message" checked={isWelcomeEnabled} onCheckedChange={setWelcomeEnabled} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="welcome-text">Welcome Message Text</Label>
                                    <Textarea
                                        id="welcome-text"
                                        placeholder="Type your welcome message here."
                                        value={welcomeMessage}
                                        onChange={(e) => setWelcomeMessage(e.target.value)}
                                        className="rounded-2xl"
                                        rows={4}
                                        disabled={!isWelcomeEnabled}
                                        suppressHydrationWarning={true}
                                    />
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveAutomations}>Save Automations</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TEAM TAB - Connected to Supabase */}
                    <TabsContent value="team">
                        <Card className="max-w-4xl">
                            <CardHeader>
                                <CardTitle>Team Management</CardTitle>
                                <CardDescription>
                                    Manage your internal staff and their roles.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Button className="mb-6 rounded-full" disabled>Invite Member</Button>
                                <div className="space-y-6">
                                     {teamMembers.length > 0 ? (
                                        teamMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={member.avatar_url} />
                                                        <AvatarFallback>{member.full_name ? member.full_name.charAt(0) : 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-base">{member.full_name || 'Unknown User'}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                                            </div>
                                         ))
                                     ) : (
                                         <p className="text-sm text-muted-foreground">No team members found.</p>
                                     )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}