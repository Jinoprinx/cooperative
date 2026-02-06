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
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { getImageUrl } from '@/app/utils/imageUtils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout, isAuthenticated } = useAuth();

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
          <p className="text-white/40 font-medium tracking-widest uppercase text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-surface border-r border-border pt-5 pb-4"
            >
              <div className="px-6 flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
                    <span className="text-white font-bold -rotate-12 italic text-xl">C</span>
                  </div>
                  <span className="text-xl font-display font-bold text-white tracking-tight">Coop</span>
                </Link>
                <button
                  type="button"
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  onClick={toggleSidebar}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 px-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${pathname === item.href
                      ? 'bg-primary text-primary'
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon className={`mr-4 h-5 w-5 ${pathname === item.href ? 'text-primary' : 'text-current'}`} />
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="group flex items-center rounded-xl px-4 py-3 text-sm font-bold text-white/40 hover:bg-red-500/10 hover:text-red-400 w-full transition-all"
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-surface/50">
        <div className="flex flex-col flex-1 pt-8 pb-4">
          <div className="px-8 mb-12">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transform rotate-12 shadow-lg shadow-primary">
                <span className="text-white font-bold -rotate-12 italic text-2xl">C</span>
              </div>
              <span className="text-2xl font-display font-bold text-white tracking-tight">
                Coop
              </span>
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-1.5">
            <div className="px-4 mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Navigation</div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${pathname === item.href
                  ? 'bg-primary text-primary shadow-sm'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon className={`mr-4 h-5 w-5 transition-transform group-hover:scale-110 ${pathname === item.href ? 'text-primary' : 'text-current'}`} />
                {item.name}
              </Link>
            ))}
            <div className="pt-8 px-4 mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Session</div>
            <button
              onClick={handleSignOut}
              className="group flex items-center rounded-xl px-4 py-3.5 text-sm font-bold text-white/40 hover:bg-red-500/10 hover:text-red-400 w-full transition-all"
            >
              <FaSignOutAlt className="mr-4 h-5 w-5" />
              Log Out
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 flex-shrink-0 glass-navbar px-4 lg:px-8 items-center justify-between">
          <button
            type="button"
            className="p-2 text-white/40 lg:hidden"
            onClick={toggleSidebar}
          >
            <FaBars className="h-6 w-6" />
          </button>

          <div className="flex-1 flex items-center lg:px-0">
            <h2 className="text-lg font-bold text-white/80 hidden sm:block">
              {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white tracking-tight">{user?.firstName} {user?.lastName}</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">Member</span>
            </div>
            <div className="relative group cursor-pointer">
              {user?.profileImage ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/5 group-hover:ring-primary transition-all">
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface-lighter flex items-center justify-center border border-border group-hover:border-primary transition-all">
                  <FaUserCircle className="h-6 w-6 text-white/20" />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-6xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
