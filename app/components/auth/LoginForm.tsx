'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { FaLock, FaUser, FaCircleNotch } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
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

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(data.credential, data.password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-red-500 border border-red-500 p-4"
          >
            <div className="flex">
              <div className="text-sm text-red-400 font-medium">{error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="credential" className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">
            Email or Phone
          </label>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <FaUser className="h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="credential"
              type="text"
              autoComplete="email"
              className={`block w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${errors.credential ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
                }`}
              placeholder="e.g. name@company.com"
              {...register('credential')}
            />
          </div>
          {errors.credential && (
            <p className="mt-1 text-xs text-red-400 font-medium px-1" id="credential-error">
              {errors.credential.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="password" className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Password
            </label>
            <Link href="/auth/forgot-password" title="Forgot Password" className="text-xs font-bold text-white/30 hover:text-white transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <FaLock className="h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={`block w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.password ? 'border-red-500 ring-2 ring-red-500' : ''
                }`}
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400 font-medium px-1" id="password-error">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 px-1">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className="h-4 w-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
        />
        <label htmlFor="remember-me" className="text-sm text-white/40 font-medium cursor-pointer select-none">
          Keep me signed in
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 relative overflow-hidden group disabled:opacity-70"
      >
        <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center justify-center'}>
          Enter Cooperative
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FaCircleNotch className="animate-spin text-lg" />
          </div>
        )}
      </button>
    </form>
  );
}