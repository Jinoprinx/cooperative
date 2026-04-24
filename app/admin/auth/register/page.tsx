'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/app/components/auth/AuthLayout';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AdminRegister() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/register`, {
        ...data,
        isAdmin: true,
      });
      router.push('/admin/auth/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Registry"
      subtitle="Establish administrative credentials"
      linkText="Log in"
      linkHref="/admin/auth/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 animate-shake">
            <div className="text-xs font-black uppercase tracking-widest text-red-500 text-center">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative group/field">
              <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Forename</span>
              <input
                type="text"
                autoComplete="given-name"
                className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                  errors.firstName ? 'border-red-500/50' : 'border-border'
                }`}
                placeholder="First Name"
                {...register('firstName')}
              />
            </div>

            <div className="relative group/field">
              <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Surname</span>
              <input
                type="text"
                autoComplete="family-name"
                className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                  errors.lastName ? 'border-red-500/50' : 'border-border'
                }`}
                placeholder="Last Name"
                {...register('lastName')}
              />
            </div>
          </div>

          <div className="relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Credential ID</span>
            <input
              type="email"
              autoComplete="email"
              className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                errors.email ? 'border-red-500/50' : 'border-border'
              }`}
              placeholder="Email address"
              {...register('email')}
            />
          </div>

          <div className="relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Access Vector</span>
            <input
              type="password"
              autoComplete="new-password"
              className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                errors.password ? 'border-red-500/50' : 'border-border'
              }`}
              placeholder="Password"
              {...register('password')}
            />
          </div>

          <div className="relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Contact Matrix</span>
            <input
              type="tel"
              autoComplete="tel"
              className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                errors.phoneNumber ? 'border-red-500/50' : 'border-border'
              }`}
              placeholder="Phone Number"
              {...register('phoneNumber')}
            />
          </div>

          <div className="flex items-center gap-4 bg-surface p-4 rounded-2xl border border-border">
            <div className="h-5 w-5 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
              <div className="h-2 w-2 bg-primary rounded-full shadow-glow-sm" />
            </div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary-text">
              Directorship Privileges Granted
            </label>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-none border-none disabled:opacity-50"
          >
            {loading ? 'Initializing...' : 'Authorize Registration'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}