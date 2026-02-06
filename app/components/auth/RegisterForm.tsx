'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaCircleNotch } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '@/app/context/TenantContext';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
  coopName: z.string().min(3, 'Cooperative name must be at least 3 characters').optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens').optional(),
  superAdminKey: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register${tenant ? '/member' : ''}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        coopName: data.coopName,
        subdomain: data.subdomain,
        superAdminKey: data.superAdminKey,
        tenantId: tenant?.id || tenant?._id,
      });

      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">First Name</label>
          <div className="relative group">
            <input
              type="text"
              className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.firstName ? 'border-red-500/50' : ''}`}
              placeholder="John"
              {...register('firstName')}
            />
          </div>
          {errors.firstName && <p className="text-[10px] text-red-400 font-medium px-1">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Last Name</label>
          <div className="relative group">
            <input
              type="text"
              className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.lastName ? 'border-red-500/50' : ''}`}
              placeholder="Doe"
              {...register('lastName')}
            />
          </div>
          {errors.lastName && <p className="text-[10px] text-red-400 font-medium px-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Email Address</label>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaEnvelope className="h-3.5 w-3.5 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="email"
            className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.email ? 'border-red-500/50' : ''}`}
            placeholder="john@example.com"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-[10px] text-red-400 font-medium px-1">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Phone Number</label>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaPhone className="h-3.5 w-3.5 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="tel"
            className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.phoneNumber ? 'border-red-500/50' : ''}`}
            placeholder="+1 (555) 000-0000"
            {...register('phoneNumber')}
          />
        </div>
        {errors.phoneNumber && <p className="text-[10px] text-red-400 font-medium px-1">{errors.phoneNumber.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Password</label>
          <div className="relative group">
            <input
              type="password"
              className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.password ? 'border-red-500/50' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && <p className="text-[10px] text-red-400 font-medium px-1">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Confirm</label>
          <div className="relative group">
            <input
              type="password"
              className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <p className="text-[10px] text-red-400 font-medium px-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {!tenant && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-5 pt-4 border-t border-border dark:border-white/5 mt-4"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] px-1">Cooperative Details</label>
            <p className="text-[10px] text-muted-foreground dark:text-white/30 px-1 mb-2">You are registering as an administrator of a new society.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Cooperative Name</label>
            <div className="relative group">
              <input
                type="text"
                className={`w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.coopName ? 'border-red-500/50' : ''}`}
                placeholder="e.g. Coop Alpha"
                {...register('coopName')}
              />
            </div>
            {errors.coopName && <p className="text-[10px] text-red-400 font-medium px-1">{errors.coopName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Desired Subdomain</label>
            <div className="relative group">
              <div className="flex items-center">
                <input
                  type="text"
                  className={`flex-1 bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-l-xl py-2.5 pl-4 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${errors.subdomain ? 'border-red-500/50' : ''}`}
                  placeholder="coopa"
                  {...register('subdomain')}
                />
                <div className="bg-surface-lighter dark:bg-white/10 border border-l-0 border-border dark:border-white/10 rounded-r-xl py-2.5 px-4 text-muted-foreground dark:text-white/40 text-xs font-mono">
                  .localhost:3000
                </div>
              </div>
            </div>
            {errors.subdomain && <p className="text-[10px] text-red-400 font-medium px-1">{errors.subdomain.message}</p>}
          </div>
        </motion.div>
      )}

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground dark:text-white/40 uppercase tracking-widest px-1">Super Admin Key (Optional)</label>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaLock className="h-3.5 w-3.5 text-muted-foreground/50 dark:text-white/20 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="w-full bg-surface-lighter dark:bg-white/5 border border-border dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Enter key if applicable"
            {...register('superAdminKey')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3.5 relative overflow-hidden group disabled:opacity-70 mt-4"
      >
        <span className={loading ? 'opacity-0' : 'opacity-100 flex items-center justify-center font-bold tracking-tight text-sm'}>
          {tenant ? 'Create Member Profile' : 'Register Cooperative'}
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