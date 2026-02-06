'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  linkText: string;
  linkHref: string;
  children: React.ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  linkText,
  linkHref,
  children,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 hero-gradient opacity-20"></div>
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary rounded-full blur-[120px] z-0 animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] z-0 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <div className="card-premium bg-surface/70 backdrop-blur-3xl border border-glass-border p-10 rounded-3xl shadow-2xl text-foreground">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transform rotate-12 shadow-lg shadow-primary/20">
                <span className="text-white font-bold -rotate-12 italic text-xl">C</span>
              </div>
              <span className="text-2xl font-display font-bold text-foreground tracking-tight">
                Coop
              </span>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-white/50">
              {subtitle}{' '}
              <Link
                href={linkHref}
                className="font-semibold text-primary hover:text-primary-light transition-colors"
              >
                {linkText}
              </Link>
            </p>
          </div>
          {children}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground dark:text-white/20 font-medium italic">
            &copy; {new Date().getFullYear()} Modern Cooperative. Built for legacy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
