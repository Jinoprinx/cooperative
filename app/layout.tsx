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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/resolve?subdomain=${subdomain}`, {
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantData();

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased text-white bg-[#050505] min-h-screen">
        <TenantProvider initialTenant={tenant || undefined}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
