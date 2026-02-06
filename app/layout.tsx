import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';

import { headers } from 'next/headers';
import { TenantProvider } from './context/TenantContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

async function getTenantData() {
  const headersList = headers();
  const subdomain = (await headersList).get('x-tenant-subdomain');

  if (!subdomain) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tenants/resolve?subdomain=${subdomain}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching tenant data:', error);
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Coop | Modern Collective Finance',
  description: 'The definitive operating system for modern cooperatives. Experience collective finance engineered for growth and transparency.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { ThemeProvider } from './context/ThemeContext';

// ... imports

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const subdomain = (await headersList).get('x-tenant-subdomain');
  const tenant = await getTenantData();

  // If we are on a subdomain but no tenant was found, show a 404/Error page
  if (subdomain && !tenant) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className="bg-[#050505] text-white flex items-center justify-center min-h-screen">
          <div className="text-center p-8 glass-card rounded-3xl border border-white/10 max-w-md">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold">!</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Cooperative Not Found</h1>
            <p className="text-white/50 mb-8">
              The society <span className="text-white font-mono font-bold">"{subdomain}"</span> does not exist or has been deactivated.
            </p>
            <a href="http://localhost:3000" className="btn-primary inline-flex">
              Return to Landing Page
            </a>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <TenantProvider initialTenant={tenant || undefined}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
