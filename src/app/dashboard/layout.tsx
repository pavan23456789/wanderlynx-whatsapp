'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  ScrollText,
  Send,
  Settings,
  LogOut,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare },
    { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
    { href: '/dashboard/templates', label: 'Templates', icon: ScrollText },
    { href: '/dashboard/campaigns', label: 'Campaigns', icon: Send },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

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
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
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
          <div className="flex items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://picsum.photos/seed/8/40/40" alt="Admin" data-ai-hint="person portrait" />
              <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="truncate font-medium">Super Admin</p>
              <p className="truncate text-sm text-muted-foreground">
                admin@travonex.com
              </p>
            </div>
            <Link href="/login" className="ml-auto">
              <Button variant="ghost" size="icon">
                <LogOut />
              </Button>
            </Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
