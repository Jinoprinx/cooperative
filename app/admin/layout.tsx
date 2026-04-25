'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaHome,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaFileAlt,
  FaHandshake
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { useTenant } from '@/app/context/TenantContext';
import { getImageUrl } from '@/app/utils/imageUtils';
import { FaCog, FaSun, FaMoon } from 'react-icons/fa';
import ThemeToggle from '@/app/components/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { tenant } = useTenant();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  const handleSignOut = () => {
    logout();
  };
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: FaHome },
    { name: 'Members', href: '/admin/members', icon: FaUsers },
    { name: 'Transactions', href: '/admin/transactions', icon: FaMoneyBillWave },
    { name: 'Pending Payments', href: '/admin/payments/pending', icon: FaFileAlt },
    { name: 'Loans', href: '/admin/loans', icon: FaHandshake },
    { name: 'Reports', href: '/admin/reports', icon: FaChartLine },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
    { name: 'Account', href: '/admin/account', icon: FaUserCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-primary-text selection:bg-primary selection:text-white transition-colors duration-300">
      <div className="fixed inset-0 z-0 bg-[var(--mesh-gradient)] opacity-30 pointer-events-none" />
      <div className="noise-overlay" />

      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        role="dialog" 
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleSidebar} aria-hidden="true"></div>

        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col glass-card border-r border-border pt-5 pb-4">
          <div className="px-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant?.branding?.logoUrl ? (
                <img src={tenant.branding.logoUrl} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <FaHome className="text-primary" />
                </div>
              )}
              <div className="text-xl font-black tracking-tighter text-primary-text truncate max-w-[150px]">{tenant?.name || 'Admin'}</div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface border border-border text-primary-text"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 h-0 flex-1 overflow-y-auto px-4 custom-scrollbar">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                     className={`group flex items-center rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                        : 'text-secondary-text hover:text-primary-text hover:bg-surface'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-tertiary-text group-hover:text-primary-text'}`} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-border/50">
                <Link
                  href="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="group flex items-center rounded-2xl px-4 py-3.5 text-sm font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-500 shadow-lg shadow-primary/5"
                >
                  <FaUserCircle className="mr-3 h-5 w-5" />
                  Member Hub
                </Link>
              </div>
              
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="w-full group flex items-center rounded-2xl px-4 py-3.5 text-sm font-bold text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                  <FaSignOutAlt className="mr-3 h-5 w-5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-20">
        <div className="flex min-h-0 flex-1 flex-col glass-card border-r border-border m-4 rounded-[2.5rem]">
          <div className="flex flex-1 flex-col overflow-y-auto pt-8 pb-4 px-6 custom-scrollbar">
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                {tenant?.branding?.logoUrl ? (
                  <img src={tenant.branding.logoUrl} alt="Logo" className="relative h-16 w-auto object-contain" />
                ) : (
                  <div className="relative w-16 h-16 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl">
                    <FaHome className="text-white text-3xl" />
                  </div>
                )}
              </div>
              <div className="text-2xl font-black text-primary-text text-center tracking-tighter line-clamp-2 px-2 uppercase leading-none">
                {tenant?.name || 'Admin'}
              </div>
              <div className="mt-2 h-1 w-8 bg-primary rounded-full opacity-50" />
            </div>

            <nav className="flex-1 space-y-1.5 pt-4">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                   className={`group flex items-center rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-500 hover:scale-[1.02] active:scale-95 ${
                      isActive
                        ? 'bg-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                        : 'text-secondary-text hover:text-primary-text hover:bg-surface'
                    }`}
                  >
                    <item.icon className={`mr-4 h-5 w-5 transition-all duration-300 ${isActive ? 'text-white' : 'text-tertiary-text group-hover:text-primary-text group-hover:scale-110'}`} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="pt-6 mt-6 border-t border-border/50">
                <Link
                  href="/dashboard"
                  className="group flex items-center rounded-2xl px-5 py-4 text-sm font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-primary/5 hover:scale-[1.02] active:scale-95"
                >
                  <FaUserCircle className="mr-4 h-5 w-5" />
                  Member Hub
                </Link>
              </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-border">
              <button
                onClick={handleSignOut}
                className="w-full group flex items-center rounded-2xl px-5 py-4 text-sm font-bold text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                <FaSignOutAlt className="mr-4 h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-80 transition-all duration-300">
        <div className="sticky top-0 z-10 flex h-20 flex-shrink-0 backdrop-blur-xl border-b border-border bg-background/20 px-4 sm:px-8">
          <button
            type="button"
            className="px-4 text-secondary-text hover:text-primary-text lg:hidden transition-colors"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <FaBars className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 justify-between items-center h-full">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 leading-none mb-1">
                {tenant?.name || 'Administrative Portal'}
              </span>
              <h2 className="text-xl font-black text-primary-text tracking-tighter leading-none">
                {navigation.find(n => pathname.startsWith(n.href))?.name || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Welcome back</span>
                <span className="text-sm font-bold text-primary-text leading-none capitalize">{user?.firstName} {user?.lastName}</span>
              </div>
              <Link href="/admin/account" className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-12 w-12 rounded-2xl bg-surface border border-border p-0.5 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                  {user?.profileImage ? (
                    <img src={getImageUrl(user.profileImage)} alt="Profile" className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <FaUserCircle className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-10">
          <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}