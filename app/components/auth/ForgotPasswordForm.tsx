'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { FaEnvelope, FaCircleNotch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <FaCheckCircle className="text-emerald-500 text-4xl" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Check your email</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We've sent a password reset link to your email address. 
          Please follow the instructions in the email.
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

      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">
          Email Address
        </label>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaEnvelope className="h-4 w-4 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={`block w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-foreground dark:text-white placeholder:text-muted-foreground/50 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
              errors.email ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
            }`}
            placeholder="name@example.com"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-red-400 font-medium px-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 group overflow-hidden"
      >
        {isSubmitting ? (
          <FaCircleNotch className="animate-spin text-lg" />
        ) : (
          <span>Send Reset Link</span>
        )}
      </button>
    </form>
  );
}
