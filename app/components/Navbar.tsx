'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${isScrolled ? 'py-4' : 'py-6'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between px-6 py-3 transition-all duration-500 rounded-full ${isScrolled ? 'glass-navbar shadow-2xl shadow-black/20' : 'bg-transparent'
          }`}>
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
              <span className="text-white font-bold -rotate-12 italic text-xl">C</span>
            </div>
            <span className="text-2xl font-display font-bold text-white tracking-tight">
              Coop
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Process</Link>
            <Link href="#about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">About</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="btn-primary text-sm shadow-lg shadow-primary"
            >
              Join now
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
