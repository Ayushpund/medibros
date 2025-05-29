
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { SearchCheck, FileScan, UserSearch, Gift, LogIn, UserPlus } from 'lucide-react'; // Added Gift, LogIn, UserPlus
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { href: '/', label: 'Symptom Analyzer', icon: SearchCheck, requiresAuth: false },
  { href: '/book-appointment', label: 'Find & Book', icon: UserSearch, requiresAuth: false },
  { href: '/xray-analyzer', label: 'X-Ray Analyzer', icon: FileScan, requiresAuth: false },
];

const authNavItems = [
  { href: '/rewards', label: 'Rewards', icon: Gift, requiresAuth: true },
];

const publicNavItems = [
   { href: '/register', label: 'Register', icon: UserPlus, requiresAuth: false, publicOnly: true },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (isLoading) {
      // You can render a loading state for the sidebar nav items as well
      return (
        <SidebarMenu className="p-2 space-y-1">
            {[...Array(3)].map((_, i) => (
                 <SidebarMenuItem key={i}>
                    <div className="flex items-center gap-2 p-2 h-8 w-full bg-muted/50 animate-pulse rounded-md">
                        <div className="h-5 w-5 bg-muted rounded-sm"></div>
                        <div className="h-4 w-20 bg-muted rounded-sm group-data-[collapsible=icon]:hidden"></div>
                    </div>
                 </SidebarMenuItem>
            ))}
        </SidebarMenu>
      )
  }

  const navItems = [
      ...baseNavItems,
      ...(user ? authNavItems : publicNavItems),
  ].filter(item => {
      if (item.requiresAuth && !user) return false;
      if (item.publicOnly && user) return false;
      return true;
  });


  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{children: item.label, className: "capitalize"}}
            >
              <a>
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
