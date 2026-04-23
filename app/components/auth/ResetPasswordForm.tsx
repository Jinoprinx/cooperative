'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaLock, FaCircleNotch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const schema = z
  .object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      setSuccess(null);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`,
        {
          password: data.password,
        }
      );
      setSuccess(response.data.message);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <FaCheckCircle className="text-emerald-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Password Reset!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your password has been successfully updated. 
          Redirecting you to the login page...
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center space-x-3"
          >
            <FaExclamationCircle className="text-red-500 shrink-0" />
            <div className="text-xs text-red-500 font-bold">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">
            New Password
          </label>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <FaLock className="h-4 w-4 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              className={`block w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-foreground dark:text-white placeholder:text-muted-foreground/50 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                errors.password ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
              }`}
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400 font-medium px-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-xs font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">
            Confirm Password
          </label>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <FaLock className="h-4 w-4 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className={`block w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-foreground dark:text-white placeholder:text-muted-foreground/50 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
                errors.confirmPassword ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
              }`}
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400 font-medium px-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group overflow-hidden"
      >
        {isSubmitting ? (
          <FaCircleNotch className="animate-spin text-lg" />
        ) : (
          <span>Update Password</span>
        )}
      </button>
    </form>
  );
}
