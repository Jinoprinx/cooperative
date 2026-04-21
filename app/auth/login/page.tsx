'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/app/context/TenantContext';
import AuthLayout from '@/app/components/auth/AuthLayout';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  const { tenant, loading } = useTenant();
  const router = useRouter();

  // Client-side fallback: if there's no tenant (user is on the main domain),
  // redirect to tenant-select so they pick a cooperative first.
  useEffect(() => {
    if (!loading && !tenant) {
      router.replace('/tenant-select');
    }
  }, [tenant, loading, router]);

  // While loading or redirecting, don't flash the login form
  if (loading || !tenant) {
    return null;
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Or"
      linkText="create a new account"
      linkHref="/auth/register" // Redirect for new registration
    >
      <LoginForm />
    </AuthLayout>
  );
}
