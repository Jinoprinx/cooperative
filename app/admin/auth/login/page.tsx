'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/app/components/auth/AuthLayout';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, data);
      const token = response.data.token;
      localStorage.setItem('token', token);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Access administrative console"
      linkText="Register"
      linkHref="/admin/auth/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 animate-shake">
            <div className="text-xs font-black uppercase tracking-widest text-red-500 text-center">{error}</div>
          </div>
        )}

        <div className="space-y-4">
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
            {errors.email && (
              <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{errors.email.message}</p>
            )}
          </div>

          <div className="relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Access Vector</span>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full bg-surface border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold ${
                errors.password ? 'border-red-500/50' : 'border-border'
              }`}
              placeholder="Password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-none border-none disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Initiate Login'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}