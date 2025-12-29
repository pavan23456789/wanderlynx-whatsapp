'use client';
// ⚠️ GLOBAL LAYOUT CONTRACT
// Fixed: Handles Async Auth correctly to prevent "charAt" crashes.

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
  History,
  Menu,
  Loader2 // Added Loader icon
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Marketing', 'Customer Support'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, roles: ['Super Admin', 'Marketing', 'Customer Support'], badge: '12' },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users, roles: ['Super Admin', 'Marketing', 'Customer Support'] },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send, roles: ['Super Admin', 'Marketing'] },
  { href: '/dashboard/templates', label: 'Templates', icon: ScrollText, roles: ['Super Admin', 'Marketing', 'Customer Support'] },
];

const adminMenuItems = [
  { href: '/dashboard/logs', label: 'Event Logs', icon: History, roles: ['Super Admin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['Super Admin'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // ✅ FIX: Use async/await to handle the real database response
  React.useEffect(() => {
    async function checkAuth() {
        try {
            const currentUser = await getCurrentUser(); // Wait for Supabase
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-lg font-semibold text-muted-foreground">
            Loading Platform...
            </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const accessibleMenuItems = menuItems.filter(item =>
    item.roles.includes(user.role)
  );
  const accessibleAdminItems = adminMenuItems.filter(item =>
    item.roles.includes(user.role)
  );

  return (
    <SidebarProvider>
      {/* 🔑 THIS WRAPPER FIXES ALL SHRINKING ISSUES */}
      <div className="flex h-screen w-full min-w-0 overflow-hidden">

        {/* SIDEBAR (fixed width, never shrinks) */}
        <Sidebar className="shrink-0">
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
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            {accessibleAdminItems.length > 0 && (
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
            )}
          </SidebarContent>

          <SidebarFooter>
            <Separator className="mb-2" />
            <div className="flex items-center gap-3 rounded-2xl p-2 bg-secondary/50">
              <Avatar className="h-11 w-11 border">
                <AvatarImage src={user.avatar} alt={user.name} />
                {/* ✅ SAFE FALLBACK: Prevents crash if name is loading/empty */}
                <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="ml-auto rounded-full size-9"
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CONTENT (can shrink safely now) */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
            <div className="flex items-center gap-2">
              <TravonexLogo className="size-7 text-primary" />
              <span className="text-md font-semibold">Wanderlynx</span>
            </div>
            <SidebarTrigger
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Menu className="size-5" />
            </SidebarTrigger>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
          
          <footer className="shrink-0 border-t bg-background p-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Wanderlynx Labs LLP. All rights reserved. {' | '}
            <Link href="/privacy" className="hover:text-primary hover:underline">
              Privacy Policy
            </Link>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}