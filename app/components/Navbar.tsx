'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/app/context/AuthContext';
import { useTenant } from '@/app/context/TenantContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { tenant } = useTenant();

  // Dynamic branding logic
  const logoChar = tenant?.name ? tenant.name.charAt(0).toUpperCase() : 'C';
  const coopName = tenant?.name || 'Coop';
  const logoUrl = tenant?.branding?.logoUrl;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={`fixed top-0 left-0 z-50 w-full transition-[padding] duration-200 ease-[var(--ease-out)] ${isScrolled ? 'py-3' : 'py-6'
        }`}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className={`flex items-center justify-between px-4 md:px-8 py-4 transition-[background-color,border-color,box-shadow] duration-200 ease-out rounded-[2rem] ${isScrolled ? 'glass-navbar shadow-[0_8px_32px_0_var(--shadow-color)]' : 'bg-transparent border border-transparent'
          }`}>
          <Link href="/" className="flex items-center space-x-3 group active:scale-[0.98] transition-transform duration-150">
            <div
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden shrink-0 transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-105"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black italic text-2xl tracking-tighter">{logoChar}</span>
              )}
            </div>
            <span className="text-2xl font-display font-black text-primary-text tracking-tight group-hover:text-primary transition-colors duration-150">
              {coopName}
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-10">
            {['Features', 'Process', 'About'].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-semibold text-secondary-text hover:text-primary transition-colors duration-150"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            <ThemeToggle />

            {user ? (
              <>
                <button
                  onClick={logout}
                  className="px-6 py-2.5 text-sm font-bold text-secondary-text hover:text-primary-text transition-colors"
                >
                  Log out
                </button>
                <div
                  className="btn-primary text-sm !px-7 !py-2.5 shadow-xl shadow-primary/20 pointer-events-none"
                >
                  Welcome, {user.firstName}
                </div>
              </>
            ) : (
              <>
                <Link
                  href={tenant ? "/auth/login" : "/tenant-select"}
                  className="px-3 md:px-6 py-2.5 text-sm font-bold text-secondary-text hover:text-primary-text transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href={tenant ? "/auth/register" : "/tenant-select"}
                  className="btn-primary text-sm !px-4 md:!px-7 !py-2.5 shadow-xl shadow-primary/20"
                >
                  {tenant ? "Join now" : "Get Started"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
