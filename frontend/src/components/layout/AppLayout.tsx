import {
  FolderClosed,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/format';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/collections', label: 'Collections', icon: FolderClosed },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 border-r border-line bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-soft hover:bg-subtle"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-subtle"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full flex-col p-4">
      <Logo className="px-2 py-1" />

      <nav className="mt-8 space-y-1">
        {NAV.map((item) => (
          <SideLink key={item.to} to={item.to} icon={<item.icon className="h-4 w-4" />}>
            {item.label}
          </SideLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1">
        <SideLink to="/settings" icon={<Settings className="h-4 w-4" />}>
          Settings
        </SideLink>
        <button
          onClick={toggle}
          className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-subtle hover:text-ink"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line p-2.5">
          <Avatar name={user?.name ?? ''} url={user?.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-ink-faint">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="focus-ring rounded-md p-1.5 text-ink-faint hover:bg-subtle hover:text-ink"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SideLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-soft hover:bg-subtle hover:text-ink',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

export function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return url ? (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
      style={{ width: size, height: size }}
    >
      {initials || '?'}
    </div>
  );
}

/** Standard padded page container used by every page except chat. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 py-8 sm:px-8', className)}>{children}</div>;
}
