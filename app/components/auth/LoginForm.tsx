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
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { getMainDomain } from '@/app/utils/domain';

const loginSchema = z.object({
  credential: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, handleGoogleAuthSuccess, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [googleIdToken, setGoogleIdToken] = useState('');

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
    setLoading(true);
    try {
      await login(data.credential, data.password, tenant?.id || tenant?._id);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleIdToken(credentialResponse.credential);
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`, {
        idToken: credentialResponse.credential,
      });

      if (response.data.needsSelection) {
        setAvailableTenants(response.data.tenants);
        setShowPicker(true);
      } else {
        handleGoogleAuthSuccess(response.data.token, response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign In failed');
    } finally {
      setLoading(false);
    }
  };

  const selectTenant = async (selectedTenantId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/select-tenant`, {
        idToken: googleIdToken,
        tenantId: selectedTenantId,
      });
      handleGoogleAuthSuccess(response.data.token, response.data.user);
      setShowPicker(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tenant selection failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectToMainDomain = () => {
    const mainDomain = getMainDomain();
    const protocol = window.location.protocol;
    window.location.href = `${protocol}//${mainDomain}/auth/login`;
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

      {!tenant && (
        <div className="space-y-4 mb-6">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign In failed')}
              theme="filled_black"
              shape="pill"
              text="signin_with"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-tertiary-text">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
        </div>
      )}

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
        <span className={loading || authLoading ? 'opacity-0' : 'opacity-100 flex items-center justify-center'}>
          Enter Cooperative
        </span>
        {(loading || authLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>

      {tenant && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-tertiary-text">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={redirectToMainDomain}
              className="w-full max-w-[400px] bg-[#131314] hover:bg-[#131314]/90 text-white font-medium py-3 px-4 rounded-full flex items-center justify-center gap-3 transition-colors border border-[#8e918f]/30 h-10"
            >
              <FcGoogle className="text-lg" />
              <span className="text-[13px] font-roboto tracking-wide">Sign in with Google</span>
            </button>
          </div>
        </div>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-surface border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-2xl font-black mb-2 text-primary-text">Select Cooperative</h3>
            <p className="text-xs text-tertiary-text mb-6">You are a member of multiple cooperatives. Please choose one to enter.</p>
            
            <div className="space-y-3">
              {availableTenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTenant(t.id)}
                  disabled={loading}
                  className="w-full p-4 rounded-2xl border border-border bg-background hover:border-primary transition-all flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-black text-lg">{t.name[0]}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-primary-text group-hover:text-primary transition-colors">{t.name}</div>
                    <div className="text-[10px] text-tertiary-text tracking-widest uppercase">{t.subdomain}</div>
                  </div>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setShowPicker(false)} className="w-full mt-6 py-4 rounded-2xl border border-border font-black text-[11px] uppercase tracking-widest text-tertiary-text hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </form>
  );
}