'use client';

import * as React from 'react';
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
import { getCurrentUser, User } from '@/lib/auth';

const teamMembers = [
    {
        id: '2',
        name: 'John Doe',
        email: 'john.doe@travonex.com',
        role: 'Internal Staff',
        avatar: 'https://picsum.photos/seed/9/40/40',
    },
    {
        id: '3',
        name: 'Jane Appleseed',
        email: 'jane.a@travonex.com',
        role: 'Internal Staff',
        avatar: 'https://picsum.photos/seed/10/40/40',
    }
];

export default function SettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<User | null>(null);
    const [welcomeMessage, setWelcomeMessage] = React.useState("Thanks for contacting Travonex! An agent will be with you shortly.");
    const [isWelcomeEnabled, setWelcomeEnabled] = React.useState(true);

    React.useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your profile information has been updated.",
        });
    };

    const handleSaveAutomations = () => {
        toast({
            title: "Automations Saved",
            description: "Your automation settings have been updated.",
        });
    };

    if (!user) {
        return <div>Loading...</div>;
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
                                        <Input id="name" defaultValue={user.name} className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue={user.email} className="rounded-xl" readOnly />
                                    </div>
                                </div>
                                 <div className="space-y-2 max-w-sm">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input id="password" type="password" className="rounded-xl" placeholder="••••••••" />
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveChanges}>Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
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
                                    />
                                </div>
                                <Button className="rounded-full" size="lg" onClick={handleSaveAutomations}>Save Automations</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
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
                                     {teamMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={member.avatar} data-ai-hint="person portrait" />
                                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-base">{member.name}</p>
                                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            <Badge>{member.role}</Badge>
                                        </div>
                                     ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
