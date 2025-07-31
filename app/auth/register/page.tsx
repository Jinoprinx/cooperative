import AuthLayout from '@/app/components/auth/AuthLayout';
import RegisterForm from '@/app/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create a new account"
      subtitle="Already have an account?"
      linkText="Sign in"
      linkHref="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
