'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/app/context/TenantContext';
import AuthLayout from '@/app/components/auth/AuthLayout';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  const { loading } = useTenant();
  const router = useRouter();

  // While loading context, don't flash the login form
  if (loading) {
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
