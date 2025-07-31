
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import AuthLayout from '@/app/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Your Password?"
      subtitle="Enter your email to reset your password"
      linkText="Back to Sign In"
      linkHref="/auth/login"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
