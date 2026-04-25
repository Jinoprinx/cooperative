'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaHistory,
  FaMoneyBillWave,
  FaChartLine,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaUserShield,
  FaTimes,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/utils/imageUtils';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout, isAuthenticated, isAdmin } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FaHome },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FaHistory },
    { name: 'Loans', href: '/dashboard/loans', icon: FaMoneyBillWave },
    { name: 'Surety Requests', href: '/dashboard/loans/surety', icon: FaUserShield },
    { name: 'Account', href: '/dashboard/account', icon: FaUserCircle },
  ];

  const handleSignOut = () => {
    logout();
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <FaChartLine className="h-10 w-10 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-secondary-text font-medium tracking-widest uppercase text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary selection:text-white transition-colors duration-300">
      <div className="fixed inset-0 z-0 bg-[var(--mesh-gradient)] opacity-30 pointer-events-none" />
      <div className="noise-overlay" />

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[110] flex w-full max-w-xs flex-col glass-card border-r border-border pt-5 pb-4"
            >
              <div className="px-6 flex items-center justify-between mb-10">
                <Link href="/" className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-primary-foreground font-black italic text-xl">C</span>
                  </div>
                  <span className="text-xl font-black text-primary-text tracking-tighter uppercase">Coop</span>
                </Link>
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface border border-border text-secondary-text hover:text-primary-text transition-colors"
                  onClick={toggleSidebar}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 px-4 space-y-2 overflow-y-auto">
                <div className="px-4 mb-4 text-[10px] font-black text-tertiary-text uppercase tracking-[0.3em]">Main Menu</div>
                {navigation.map((item) => {
                   const isActive = pathname === item.href;
                   return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                          : 'text-secondary-text hover:bg-surface hover:text-primary-text'
                      }`}
                    >
                      <item.icon className={`mr-4 h-5 w-5 transition-transform ${isActive ? 'text-white' : 'text-current group-hover:scale-110'}`} />
                      {item.name}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-border/50">
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setSidebarOpen(false)}
                      className="group flex items-center rounded-2xl px-5 py-4 text-sm font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-500 shadow-lg shadow-primary/5"
                    >
                      <FaUserShield className="mr-4 h-5 w-5" />
                      Switch to Admin
                    </Link>
                  </div>
                )}
              </div>
              <div className="px-4 pt-6 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="group flex items-center rounded-2xl px-5 py-4 text-sm font-bold text-secondary-text hover:bg-red-500/10 hover:text-red-400 w-full transition-all"
                >
                  <FaSignOutAlt className="mr-4 h-5 w-5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-20">
        <div className="flex flex-col flex-1 glass-card border-r border-border m-4 rounded-[2.5rem] p-6 pt-10">
          <div className="px-4 mb-14">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group hover:scale-105 transition-transform duration-500">
                <span className="text-primary-foreground font-black italic text-2xl">C</span>
                <div className="absolute inset-0 bg-primary/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary-text tracking-tighter uppercase leading-none">Coop</span>
                <span className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] leading-none mt-1">Platform</span>
              </div>
            </Link>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto">
            <div className="px-5 mb-4 text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em]">Navigator</div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-500 hover:scale-[1.02] active:scale-95 ${
                    isActive
                      ? 'bg-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                      : 'text-secondary-text hover:bg-surface hover:text-primary-text'
                  }`}
                >
                  <item.icon className={`mr-4 h-5 w-5 transition-transform duration-300 ${isActive ? 'text-white' : 'text-current group-hover:scale-110'}`} />
                  {item.name}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-border/50">
                <Link
                  href="/admin/dashboard"
                  className="group flex items-center rounded-2xl px-6 py-4 text-sm font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-primary/5 hover:scale-[1.02] active:scale-95"
                >
                  <FaUserShield className="mr-4 h-5 w-5" />
                  Admin Control
                </Link>
              </div>
            )}
          </nav>

          <div className="pt-8 border-t border-border">
            <button
              onClick={handleSignOut}
              className="group flex items-center rounded-2xl px-6 py-4 text-sm font-bold text-secondary-text hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-300"
            >
              <FaSignOutAlt className="mr-4 h-5 w-5 transition-colors" />
              Logout Session
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-80 transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 backdrop-blur-xl bg-background/20 border-b border-border px-4 lg:px-10 items-center justify-between">
          <button
            type="button"
            className="p-3 bg-surface rounded-2xl border border-border text-secondary-text lg:hidden"
            onClick={toggleSidebar}
          >
            <FaBars className="h-6 w-6" />
          </button>

          <div className="flex flex-col ml-4 lg:ml-0">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 leading-none mb-1">
              Member Workspace
            </span>
            <h2 className="text-xl font-black text-primary-text tracking-tighter leading-none">
              {navigation.find(n => n.href === pathname)?.name || 'Account'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-primary-text tracking-tight leading-none mb-1">{user?.firstName} {user?.lastName}</span>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified Member</span>
            </div>
            
            <Link href="/dashboard/account" className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border p-0.5 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                {user?.profileImage ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <FaUserCircle className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
