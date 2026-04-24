'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { FaLock, FaUser, FaCircleNotch } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { useTenant } from '@/app/context/TenantContext';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  credential: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, loading } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { tenant } = useTenant();

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(data.credential, data.password, tenant?.id || tenant?._id);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <div className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Entry Credentials</span>
          <div className="relative">
            <input
              id="credential"
              type="text"
              autoComplete="email"
              className={`block w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.credential ? 'border-red-500/50' : ''}`}
              placeholder="Email or phone number"
              {...register('credential')}
            />
          </div>
          {errors.credential && (
            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
              {errors.credential.message}
            </p>
          )}
        </div>

        <div className="space-y-2 relative group/field">
          <div className="flex justify-between items-center absolute top-2 left-6 right-6 z-10">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Security Vector</span>
            <Link href="/auth/forgot-password" title="Forgot Password" className="text-[8px] font-black text-tertiary-text hover:text-primary uppercase tracking-[0.2em] transition-colors">
              Reset Key?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`block w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text tracking-[0.3em] ${errors.password ? 'border-red-500/50' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 px-2">
         <div className="relative">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="peer appearance-none h-5 w-5 rounded-lg border border-border bg-surface checked:bg-primary checked:border-primary transition-all cursor-pointer"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
             <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
        <label htmlFor="remember-me" className="text-[10px] font-black text-tertiary-text uppercase tracking-widest cursor-pointer hover:text-secondary-text transition-colors">
          Keep me signed in
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:tracking-[0.6em] transition-all duration-500 disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center justify-center'}>
          Enter Cooperative
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>
    </form>
  );
}