import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Scissors,
  Library,
  CalendarClock,
  Share2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/clip-studio', label: 'Clip Studio', icon: Scissors },
  { to: '/app/library', label: 'Library', icon: Library },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarClock },
  { to: '/app/accounts', label: 'Connected Accounts', icon: Share2 },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (_) {
      // proceed with local logout regardless
    }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  const items = user?.role === 'admin' ? [...navItems, { to: '/app/admin', label: 'Admin', icon: ShieldCheck }] : navItems;

  const NavContent = (
    <>
      <div className="mb-8 px-2">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-bg-raised text-text-primary shadow-glow'
                  : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised font-display text-sm text-text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="truncate text-xs capitalize text-text-secondary">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full justify-start">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-bg-surface p-4 lg:flex">
        {NavContent}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg-surface px-4 lg:hidden">
        <Logo size="small" />
        <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-bg-surface p-4 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="btn-ghost absolute right-3 top-3 p-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {NavContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
