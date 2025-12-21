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

export default function SettingsPage() {
    return (
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">Settings</h1>
            </div>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <Tabs defaultValue="account" className="w-full md:col-span-2">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="automations">Automations</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>
                                    Manage your profile information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4">
                                     <Avatar className="h-20 w-20">
                                        <AvatarImage src="https://picsum.photos/seed/8/80/80" data-ai-hint="person portrait" />
                                        <AvatarFallback>SA</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline">Change Photo</Button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue="Super Admin" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue="admin@travonex.com" />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input id="password" type="password" />
                                </div>
                                <Button>Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="automations">
                        <Card>
                            <CardHeader>
                                <CardTitle>Automations</CardTitle>
                                <CardDescription>
                                    Configure automatic replies and actions.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="welcome-message" className="text-base">
                                            Automatic Welcome Message
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Send a reply automatically on the first message from a new contact.
                                        </p>
                                    </div>
                                    <Switch id="welcome-message" defaultChecked />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="welcome-text">Welcome Message Text</Label>
                                    <Textarea
                                        id="welcome-text"
                                        placeholder="Type your welcome message here."
                                        defaultValue="Thanks for contacting Travonex! An agent will be with you shortly."
                                    />
                                </div>
                                <Button>Save Automations</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="team">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Management</CardTitle>
                                <CardDescription>
                                    Manage your internal staff and their roles.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Button className="mb-4">Invite Member</Button>
                                {/* In a real app, this would be a table of users */}
                                <div className="space-y-4">
                                     <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src="https://picsum.photos/seed/9/40/40" data-ai-hint="person portrait" />
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">John Doe</p>
                                                <p className="text-sm text-muted-foreground">john.doe@travonex.com</p>
                                            </div>
                                        </div>
                                        <Badge>Internal Staff</Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src="https://picsum.photos/seed/10/40/40" data-ai-hint="person portrait" />
                                                <AvatarFallback>JA</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">Jane Appleseed</p>
                                                <p className="text-sm text-muted-foreground">jane.a@travonex.com</p>
                                            </div>
                                        </div>
                                        <Badge>Internal Staff</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
