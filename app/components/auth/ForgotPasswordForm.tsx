'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { FaEnvelope, FaCircleNotch, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        { ...data, origin: window.location.origin }
      );
      setSuccess(response.data.message);
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
        <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Transmission Successful</h3>
        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xs mx-auto mb-10">
          We've dispatched a secure recovery vector to your communication endpoint.
        </p>
        <Link href="/auth/login" className="btn-secondary inline-flex items-center gap-3 px-8 text-xs font-black uppercase tracking-widest">
           <FaArrowLeft className="text-[10px]" /> Return to Base
        </Link>
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

      <div className="space-y-2 relative group/field">
        <span className="absolute top-2 left-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Recovery Identity</span>
        <div className="relative">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={`w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 pt-10 text-white text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-white/10 ${
              errors.email ? 'border-red-500/50' : ''
            }`}
            placeholder="name@example.com"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:tracking-[0.6em] transition-all duration-500 disabled:opacity-50"
        >
          <span className={isSubmitting ? 'opacity-0' : 'opacity-100'}>Dispatch Reset Vector</span>
          {isSubmitting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </button>

        <Link 
          href="/auth/login" 
          className="flex items-center justify-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-colors py-2"
        >
          <FaArrowLeft className="text-[8px]" /> Remember Protocols?
        </Link>
      </div>
    </form>
  );
}

