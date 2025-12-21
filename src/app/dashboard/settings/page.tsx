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

export default function SettingsPage() {
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
                                <CardDescription>
                                    Manage your profile information.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="flex items-center gap-6">
                                     <Avatar className="h-24 w-24">
                                        <AvatarImage src="https://picsum.photos/seed/8/80/80" data-ai-hint="person portrait" />
                                        <AvatarFallback>SA</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" className="rounded-full">Change Photo</Button>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" defaultValue="Super Admin" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue="admin@travonex.com" className="rounded-xl" />
                                    </div>
                                </div>
                                 <div className="space-y-2 max-w-sm">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input id="password" type="password" className="rounded-xl" />
                                </div>
                                <Button className="rounded-full" size="lg">Save Changes</Button>
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
                                    <Switch id="welcome-message" defaultChecked />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="welcome-text">Welcome Message Text</Label>
                                    <Textarea
                                        id="welcome-text"
                                        placeholder="Type your welcome message here."
                                        defaultValue="Thanks for contacting Travonex! An agent will be with you shortly."
                                        className="rounded-2xl"
                                        rows={4}
                                    />
                                </div>
                                <Button className="rounded-full" size="lg">Save Automations</Button>
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
                                 <Button className="mb-6 rounded-full">Invite Member</Button>
                                <div className="space-y-6">
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src="https://picsum.photos/seed/9/40/40" data-ai-hint="person portrait" />
                                                <AvatarFallback>JD</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-base">John Doe</p>
                                                <p className="text-sm text-muted-foreground">john.doe@travonex.com</p>
                                            </div>
                                        </div>
                                        <Badge>Internal Staff</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src="https://picsum.photos/seed/10/40/40" data-ai-hint="person portrait" />
                                                <AvatarFallback>JA</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-base">Jane Appleseed</p>
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
