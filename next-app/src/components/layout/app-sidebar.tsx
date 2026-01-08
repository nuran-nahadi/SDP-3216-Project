'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Calendar,
  BookOpen,
  User,
  LogOut,
  Sparkles,
  MessageSquarePlus,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Daily Update',
    href: '/daily-update',
    icon: MessageSquarePlus,
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: Wallet,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Journal',
    href: '/journal',
    icon: BookOpen,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (
      (firstInitial + lastInitial).toUpperCase() ||
      user.username?.[0]?.toUpperCase() ||
      'U'
    );
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'User';
  };

  return (
    <aside
      className={cn(
        'flex flex-col w-72 border-r-2 border-primary/20 bg-gradient-to-b from-card via-primary/5 to-muted/30 shadow-lg',
        className
      )}
    >
      {/* Logo Header */}
      <div className="flex items-center justify-center p-6">
        <h1 className="text-4xl font-bold text-primary tracking-wider drop-shadow-lg">
          LIN
        </h1>
      </div>

      <Separator className="mx-4 bg-primary/20" />

      {/* Dark Mode Toggle */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-foreground">
            Theme
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <Separator className="mx-4 bg-primary/20" />

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={isActive ? {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))'
              } : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 relative overflow-hidden group',
                isActive
                  ? 'shadow-2xl shadow-primary/50 scale-105 border-2 border-primary-foreground/30'
                  : 'text-muted-foreground border-2 border-transparent hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:shadow-lg hover:translate-x-1'
              )}
            >
              {/* Decorative shine overlay for active state */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent pointer-events-none" />
              )}
              
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-transform relative z-10",
                isActive && "scale-125 drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]"
              )} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="ml-auto relative z-10">
                  <Sparkles className="h-4 w-4 animate-pulse drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-4 bg-primary/20" />

      {/* User Info Section */}
      <div className="p-4 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30 transition-all hover:shadow-md">
          <Avatar className="h-12 w-12 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            <AvatarImage
              src={user?.profile_picture_url || undefined}
              alt={getUserDisplayName()}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-lg">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-foreground">
              {getUserDisplayName()}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
