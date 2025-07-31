
import ResetPasswordForm from '@/app/components/auth/ResetPasswordForm';
import AuthLayout from '@/app/components/auth/AuthLayout';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your new password below"
      linkText="Back to Sign In"
      linkHref="/auth/login"
    >
      <ResetPasswordForm token={params.token} />
    </AuthLayout>
  );
}
