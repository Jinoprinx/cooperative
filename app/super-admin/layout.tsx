'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaChartBar, 
  FaGlobe, 
  FaUserShield, 
  FaSignOutAlt, 
  FaCrown,
  FaShieldAlt
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Redirect if not super-admin
  React.useEffect(() => {
    if (user && user.role !== 'super-admin') {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const navItems = [
    { name: 'Platform Overview', href: '/super-admin/dashboard', icon: FaChartBar },
    { name: 'Cooperative Tenants', href: '/super-admin/tenants', icon: FaGlobe },
    { name: 'Account Recovery', href: '/super-admin/recovery', icon: FaUserShield },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
      {/* Executive Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0a0a0a] border-r border-amber-500/20 z-50">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              <FaCrown className="text-black text-2xl" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-amber-500">PLATFORM</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">EXECUTIVE</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-amber-500' : ''}`} />
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-10 left-10 right-10">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-500 text-xs font-black uppercase tracking-widest"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-12">
        {/* Header Bar */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2 block">Level 10 clearance</span>
            <h2 className="text-4xl font-black tracking-tighter">
              Executive <span className="text-white/30">Console</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-amber-500">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">System Administrator</p>
            </div>
            <div className="w-14 h-14 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent flex items-center justify-center">
               <FaShieldAlt className="text-amber-500 text-2xl" />
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
