import { LayoutDashboard, FolderKanban, Inbox, MessageSquare, MessageSquareQuote, UserCircle, Users, BarChart3, LogOut, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn.js';
import { SITE_CONFIG } from '../../lib/siteConfig.js';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin', enabled: true, end: true },
  { label: 'Projects', icon: FolderKanban, to: '/admin/projects', enabled: true },
  { label: 'Orders', icon: Inbox, to: '/admin/orders', enabled: true },
  { label: 'Messages', icon: MessageSquare, to: '/admin/messages', enabled: true },
  { label: 'Feedback', icon: MessageSquareQuote, to: '/admin/feedback', enabled: true },
  { label: 'Team', icon: Users, to: '/admin/team', enabled: true },
  { label: 'Visitors', icon: Users, to: '/admin/visitors', enabled: true },
  { label: 'Analytics', icon: BarChart3, to: '/admin/analytics', enabled: true },
  { label: 'Profile', icon: UserCircle, to: '/admin/profile', enabled: true },
];

function SidebarContent({ onNavigate, onSignOut, isSigningOut }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <span className="font-display text-base font-semibold text-foreground">
          {SITE_CONFIG.brand.split(' ')[0]} <span className="text-accent">Admin</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) =>
          item.enabled ? (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-foreground-muted hover:bg-background-raised hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ) : (
            <div
              key={item.label}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center justify-between gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium text-foreground-subtle"
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Soon
              </span>
            </div>
          )
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-raised hover:text-danger disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isSigningOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

/**
 * Desktop: a permanent left column.
 * Mobile: a slide-out drawer, toggled by AdminLayout's header button —
 * same plain-React pattern (no library) as PublicNavbar's mobile menu.
 */
export function AdminSidebar({ isMobileOpen, onCloseMobile, onSignOut, isSigningOut }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background-surface md:block">
        <SidebarContent onSignOut={onSignOut} isSigningOut={isSigningOut} />
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} aria-hidden="true" />
          <div className="relative flex h-full w-64 flex-col bg-background-surface shadow-raised">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-sm p-1 text-foreground-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={onCloseMobile} onSignOut={onSignOut} isSigningOut={isSigningOut} />
          </div>
        </div>
      )}
    </>
  );
}
