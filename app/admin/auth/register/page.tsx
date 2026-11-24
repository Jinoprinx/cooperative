'use client';

/**
 * SECURITY NOTE: The unauthenticated admin registration endpoint has been removed.
 * Admin accounts are now provisioned exclusively by authenticated super-admins
 * via the super-admin tenant management panel.
 *
 * Member self-registration is handled by the main registration flow at /auth/register.
 *
 * This page redirects to the admin login page.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRegisterRemoved() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center text-white/60 text-sm">
        <p>This page has been removed.</p>
        <p className="mt-1">Redirecting to login&hellip;</p>
      </div>
    </div>
  );
}
