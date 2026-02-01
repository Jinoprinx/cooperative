'use client';

import AuthLayout from '@/app/components/auth/AuthLayout';
import RegisterForm from '@/app/components/auth/RegisterForm';
import { useTenant } from '@/app/context/TenantContext';

export default function RegisterPage() {
  const { tenant } = useTenant();

  return (
    <AuthLayout
      title={tenant ? `Join ${tenant.name}` : "Register your Cooperative"}
      subtitle={tenant ? "Already a member?" : "Already have an account?"}
      linkText="Sign in"
      linkHref="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
