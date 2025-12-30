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
} from "@/components/ui/tabs" // FIXED: Corrected path for Tabs
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, User } from '@/lib/auth'; 
import { Lock, Loader2 } from 'lucide-react';
import { authFetch } from '@/utils/api-client'; // GEMINI FIX: Fixed 401 error
import { createClient } from '@/utils/supabase/client'; // FIXED: Corrected path for Supabase

export default function SettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<User | null>(null);
    const [teamMembers, setTeamMembers] = React.useState<any[]>([]); 
    const [isLoading, setIsLoading] = React.useState(true);
    
    const [welcomeMessage, setWelcomeMessage] = React.useState("Thanks for contacting Wanderlynx! An agent will be with you shortly.");
    const [isWelcomeEnabled, setWelcomeEnabled] = React.useState(true);

    React.useEffect(() => {
        async function loadData() {
            try {
                // 1. Load User
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                // 2. Load Team via authFetch to bypass middleware
                if (currentUser?.role === 'Super Admin') {
                    const response = await authFetch('/api/team'); 
                    if (response.ok) {
                        const data = await response.json();
                        setTeamMembers(data);
                    }
                }
                
                // 3. Load Automations
                const savedEnabled = localStorage.getItem('automations_welcome_enabled');
                const savedMessage = localStorage.getItem('automations_welcome_message');
                if (savedEnabled !== null) setWelcomeEnabled(JSON.parse(savedEnabled));
                if (savedMessage !== null) setWelcomeMessage(savedMessage);

            } catch (err) {
                console.error("Settings load error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSaveChanges = () => {
        toast({ title: "Settings Saved", description: "Profile updated." });
    };

    const handleSaveAutomations = () => {
        localStorage.setItem('automations_welcome_enabled', JSON.stringify(isWelcomeEnabled));
        localStorage.setItem('automations_welcome_message', welcomeMessage);
        toast({ title: "Automations Saved" });
    };
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
    }

    if (!user) return <div>Error loading user profile.</div>;

    if (user.role !== 'Super Admin') {
        return (
             <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:gap-8 md:p-10 text-center">
                <Lock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-3xl font-bold">Access Restricted</h1>
                <p>Only Admins can access the settings page.</p>
                <Button asChild><Link href="/dashboard">Return to Dashboard</Link></Button>
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
                        <TabsTrigger value="team">Team</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="account">
                        <Card className="max-w-4xl">
                            <CardHeader>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>Manage your profile information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex items-center gap-6">
                                     <Avatar className="h-24 w-24">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" className="rounded-full" disabled>Change Photo</Button>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue={user.name} className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue={user.email} className="rounded-xl" readOnly />
                                    </div>
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveChanges}>Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="automations">
                         <Card className="max-w-4xl">
                            <CardHeader><CardTitle>Automations</CardTitle></CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex items-center justify-between rounded-2xl p-6 bg-secondary/50">
                                    <div className="space-y-1">
                                        <Label className="text-base font-semibold">Automatic Welcome Message</Label>
                                        <p className="text-sm text-muted-foreground">Send a reply on the first message.</p>
                                    </div>
                                    <Switch checked={isWelcomeEnabled} onCheckedChange={setWelcomeEnabled} />
                                </div>
                                <div className="space-y-2">
                                    <Textarea
                                        value={welcomeMessage}
                                        onChange={(e) => setWelcomeMessage(e.target.value)}
                                        className="rounded-2xl"
                                        rows={4}
                                        disabled={!isWelcomeEnabled}
                                    />
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveAutomations}>Save Automations</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team">
                        <Card className="max-w-4xl">
                            <CardHeader><CardTitle>Team Management</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                     {teamMembers.length > 0 ? teamMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarImage src={member.avatar_url} />
                                                        <AvatarFallback>{member.full_name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{member.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">{member.role}</Badge>
                                            </div>
                                         )) : <p className="text-muted-foreground">No team members found.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}