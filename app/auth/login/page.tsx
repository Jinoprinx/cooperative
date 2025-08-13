import AuthLayout from '@/app/components/auth/AuthLayout';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
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
