'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { useTenant } from '@/app/context/TenantContext';

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
  const { tenant } = useTenant();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const isDev = process.env.NODE_ENV === 'development';

  // Debug check
  if (typeof window !== 'undefined' && isDev) {
    if (!googleClientId) {
      console.error('❌ Google Client ID is MISSING! Check your .env.local file and ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.');
    } else {
      console.log(`✅ Google Client ID initialized: ${googleClientId.substring(0, 15)}...`);
    }
  }

  const content = (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#3b82f615,transparent)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_120%,#3b82f610,transparent)]" />
        <div className="noise-overlay opacity-[0.03]" />
      </div>

      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[140px] z-0 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[160px] z-0 animate-pulse-slower"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <div className="card-premium bg-surface backdrop-blur-[40px] border border-border p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/10 to-transparent rounded-[2.5rem] -z-10 opacity-50" />
          
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center space-x-3 mb-10 group/logo">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <span className="text-white font-black -rotate-[12deg] italic text-2xl tracking-tighter">
                  {tenant ? tenant.name[0] : 'C'}
                </span>
              </div>
              <span className="text-3xl font-black text-primary-text tracking-tighter">
                {tenant ? (
                  <>
                    {tenant.name.split(' ')[0]}<span className="text-primary">{tenant.name.split(' ')[1] ? ` ${tenant.name.split(' ')[1]}` : ''}</span>
                  </>
                ) : (
                  <>
                    Coop<span className="text-primary">.io</span>
                  </>
                )}
              </span>
            </Link>
            
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-primary-text mb-4">
              {title}
            </h2>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-tertiary-text">
              {subtitle}{' '}
              <Link
                href={linkHref}
                className="text-primary hover:text-primary-text transition-colors border-b border-primary/20 hover:border-border pb-0.5 ml-1"
              >
                {linkText}
              </Link>
            </p>
          </div>
          
          <div className="relative">
            {children}
          </div>
        </div>

        <div className="mt-10 text-center animate-fade-in">
          <div className="text-[10px] text-tertiary-text font-black uppercase tracking-[0.4em] italic flex items-center justify-center gap-4">
             <div className="w-8 h-px bg-border" />
             &copy; {new Date().getFullYear()} NEXUS CORE
             <div className="w-8 h-px bg-border" />
          </div>
        </div>
      </motion.div>
    </div>
  );
  // Only initialize Google OAuth on the main domain where Google login is actually used.
  // On tenant subdomains, the "Sign in with Google" button redirects to the main domain,
  // so the Google SDK should NOT load on subdomains (their origins aren't whitelisted).
  if (!tenant && googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
