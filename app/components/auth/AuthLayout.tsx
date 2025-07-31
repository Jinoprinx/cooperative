
import Link from 'next/link';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  linkText: string;
  linkHref: string;
  children: React.ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  linkText,
  linkHref,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {subtitle}{' '}
            <Link
              href={linkHref}
              className="font-medium text-secondary hover:text-secondary-dark"
            >
              {linkText}
            </Link>
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
