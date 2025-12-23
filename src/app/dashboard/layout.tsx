'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ScrollText,
  Send,
  Settings,
  LogOut,
  ShieldCheck,
  History,
  Menu,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TravonexLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { logout, getCurrentUser, User } from '@/lib/auth';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Internal Staff'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, roles: ['Super Admin', 'Internal Staff'], badge: '12' },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users, roles: ['Super Admin', 'Internal Staff'] },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send, roles: ['Super Admin'] },
  { href: '/dashboard/templates', label: 'Templates', icon: ScrollText, roles: ['Super Admin'] },
];

const adminMenuItems = [
    { href: '/dashboard/logs', label: 'Event Logs', icon: History, roles: ['Super Admin'] },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Internal Staff'] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="text-2xl font-semibold animate-pulse">Loading Platform...</div>
        </div>
    );
  }

  if (!user) {
    return null; // Should be redirected by the effect
  }

  const accessibleMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));
  const accessibleAdminItems = adminMenuItems.filter(item => user && item.roles.includes(user.role));


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <TravonexLogo className="size-8 text-primary" />
            <span className="text-lg font-semibold">Wanderlynx</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {accessibleMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                     {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarMenu>
                 {accessibleAdminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            tooltip={{ children: item.label }}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>

        </SidebarContent>
        <SidebarFooter>
          <Separator className="mb-2" />
          <div className="flex items-center gap-3 rounded-2xl p-2 bg-secondary/50">
            <Avatar className="h-11 w-11 border">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.role}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto rounded-full size-9" suppressHydrationWarning={true}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
            <div className="flex items-center gap-2">
                <TravonexLogo className="size-7 text-primary" />
                <span className="text-md font-semibold">Wanderlynx</span>
            </div>
            <SidebarTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="size-5" />
                </Button>
            </SidebarTrigger>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
