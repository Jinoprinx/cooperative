'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaLock, FaCircleNotch, FaCheckCircle, FaExclamationCircle, FaShieldAlt } from 'react-icons/fa';
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
        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <FaCheckCircle className="text-emerald-500 text-5xl" />
        </div>
        <h3 className="text-3xl font-black text-primary-text tracking-tighter mb-4">Identity Re-Secured</h3>
        <p className="text-tertiary-text text-sm font-medium leading-relaxed max-w-xs mx-auto">
          Your access vector has been successfully recalibrated. Initiating entry sequence...
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">New Security Vector</span>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={`w-full bg-surface border border-border rounded-[2rem] p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text tracking-[0.3em] ${
              errors.password ? 'border-red-500/50' : ''
            }`}
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Verify Integrity</span>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`w-full bg-surface border border-border rounded-[2rem] p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text tracking-[0.3em] ${
              errors.confirmPassword ? 'border-red-500/50' : ''
            }`}
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full btn-primary py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:tracking-[0.6em] transition-all duration-500 disabled:opacity-50"
      >
        <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>Calibrate Identity Vector</span>
        {isSubmitting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>
    </form>
  );
}

