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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TravonexLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { logout, getCurrentUser, User } from '@/lib/auth';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Internal Staff'] },
  { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, roles: ['Super Admin', 'Internal Staff'] },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users, roles: ['Super Admin', 'Internal Staff'] },
  { href: '/dashboard/templates', label: 'Templates', icon: ScrollText, roles: ['Super Admin'] },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send, roles: ['Super Admin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['Super Admin', 'Internal Staff'] },
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
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-2xl">Loading...</div>
        </div>
    );
  }

  if (!user) {
    return null; // or a redirect component
  }

  const accessibleMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <TravonexLogo className="size-8 text-primary" />
            <span className="text-lg font-semibold">Travonex</span>
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
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-2xl p-3 hover:bg-secondary">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-auto rounded-full">
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
