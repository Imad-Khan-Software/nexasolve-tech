import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useProfile } from '../hooks/useProfile.js';

/**
 * By the time this renders, ProtectedAdminRoute (wrapping this element in
 * App.jsx) has already confirmed the session is authorized — this layout
 * only handles chrome (sidebar/header) and logout, not auth checks.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const { session, signOut } = useAdminAuth();
  const { profile } = useProfile(); // same admin_profile row the public site uses
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Same Escape-to-close + scroll-lock pattern already used by Modal.jsx
  // and PublicNavbar's mobile menu — the admin drawer was missing both.
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsMobileNavOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileNavOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/admin/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  const displayName = profile?.name || session?.user?.email || 'Admin';

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-DEFAULT p-2 text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden md:block" />

          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="shrink-0 text-sm text-foreground-muted hover:text-foreground"
              aria-label="Back to site"
            >
              <ArrowLeft className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">← Back to site</span>
            </Link>
            <div className="flex min-w-0 items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full bg-background-raised object-contain"
                />
              ) : (
                <div className="h-7 w-7 shrink-0 rounded-full bg-accent-muted" aria-hidden="true" />
              )}
              <span className="max-w-[5rem] truncate text-sm text-foreground-muted sm:max-w-[10rem]">
                {displayName}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
