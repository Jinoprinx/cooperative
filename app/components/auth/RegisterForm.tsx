'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaCircleNotch } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useTenant } from '@/app/context/TenantContext';
import { FcGoogle } from 'react-icons/fc';
import { getMainDomain } from '@/app/utils/domain';
import { useSearchParams } from 'next/navigation';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().min(1, 'Required'),
  phoneNumber: z.string().min(7, 'Invalid number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
  coopName: z.string().optional(),
  subdomain: z.string().optional(),
  superAdminKey: z.string().optional(),
  referredByName: z.string().optional(),
  referredByPhone: z.string().optional(),
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
  const [baseDomain, setBaseDomain] = useState('');

  const searchParams = useSearchParams();
  const joinTenantId = searchParams.get('joinTenant');
  
  const isJoiningTenant = !!tenant || !!joinTenantId;
  const effectiveTenantId = tenant?.id || tenant?._id || joinTenantId;

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleRefName, setGoogleRefName] = useState('');
  const [googleRefPhone, setGoogleRefPhone] = useState('');

  useEffect(() => {
    setBaseDomain(window.location.host);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      countryCode: '+234',
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: `${data.countryCode}${data.phoneNumber}`,
        coopName: data.coopName,
        subdomain: data.subdomain,
        superAdminKey: data.superAdminKey,
        tenantId: effectiveTenantId,
      };

      if (data.referredByName || data.referredByPhone) {
        payload.referredBy = {
          name: data.referredByName,
          phoneNumber: data.referredByPhone,
        };
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register${isJoiningTenant ? '/member' : ''}`, payload);

      if (data.superAdminKey) {
        router.push(`/auth/login?message=${encodeURIComponent('Super Admin account activated. Please sign in.')}`);
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse: any) => {
    setGoogleIdToken(credentialResponse.credential);
    setShowCompletionModal(true);
  };

  const submitGoogleSignup = async () => {
    if (!googlePhone) {
      setError('Phone number is required');
      setShowCompletionModal(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        idToken: googleIdToken,
        tenantId: effectiveTenantId,
        phoneNumber: googlePhone,
      };
      if (googleRefName || googleRefPhone) {
        payload.referredBy = {
          name: googleRefName,
          phoneNumber: googleRefPhone,
        };
      }
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/register`, payload);
      router.push(`/auth/login?message=${encodeURIComponent(response.data.message)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google registration failed');
      setShowCompletionModal(false);
    } finally {
      setLoading(false);
    }
  };

  const redirectToMainDomain = () => {
    const mainDomain = getMainDomain();
    const protocol = window.location.protocol;
    window.location.href = `${protocol}//${mainDomain}/auth/register?joinTenant=${tenant?.id || tenant?._id}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {!tenant && isJoiningTenant && (
        <div className="space-y-4 mb-6">
          <div className="flex justify-center">
            <GoogleLogin
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign Up failed: Request blocked or cancelled')}
              use_fedcm_for_prompt={true}
              theme="filled_black"
              shape="pill"
              text="signup_with"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-tertiary-text">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Given Name</span>
          <input
            type="text"
            className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.firstName ? 'border-red-500/50' : ''}`}
            placeholder="John"
            {...register('firstName')}
          />
          {errors.firstName && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Surname</span>
          <input
            type="text"
            className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.lastName ? 'border-red-500/50' : ''}`}
            placeholder="Doe"
            {...register('lastName')}
          />
          {errors.lastName && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2 relative group/field">
        <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Email Address</span>
        <input
          type="email"
          className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.email ? 'border-red-500/50' : ''}`}
          placeholder="john@example.com"
          {...register('email')}
        />
        {errors.email && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.email.message}</p>}
      </div>

      <div className="space-y-2 relative group/field">
        <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Communication Vector</span>
        <div className="flex gap-3">
          <div className="w-28 relative group/select">
            <select
              className="w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
              {...register('countryCode')}
            >
              <option value="+234" className="bg-surface text-primary-text">🇳🇬 +234</option>
              <option value="+1" className="bg-surface text-primary-text">🇺🇸 +1</option>
              <option value="+44" className="bg-surface text-primary-text">🇬🇧 +44</option>
              <option value="+233" className="bg-surface text-primary-text">🇬🇭 +233</option>
            </select>
          </div>
          <div className="flex-1 relative">
            <input
              type="tel"
              className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.phoneNumber ? 'border-red-500/50' : ''}`}
              placeholder="0803 123 4567"
              {...register('phoneNumber')}
            />
          </div>
        </div>
        {(errors.phoneNumber || errors.countryCode) && (
          <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">
            {errors.phoneNumber?.message || errors.countryCode?.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Security Key</span>
          <input
            type="password"
            className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text tracking-[0.3em] ${errors.password ? 'border-red-500/50' : ''}`}
            placeholder="********"
            {...register('password')}
          />
          {errors.password && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.password.message}</p>}
        </div>
        <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Verify Security</span>
          <input
            type="password"
            className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text tracking-[0.3em] ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
            placeholder="********"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {isJoiningTenant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 pt-8 border-t border-border mt-6"
        >
          <div className="space-y-1 px-2 mb-4">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Referral Program</label>
            <p className="text-[10px] text-tertiary-text font-medium">Optional: Who referred you to this cooperative?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative group/field">
              <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Referrer Name</span>
              <input
                type="text"
                className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text`}
                placeholder="Name"
                {...register('referredByName')}
              />
            </div>
            <div className="space-y-2 relative group/field">
              <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Referrer Phone</span>
              <input
                type="tel"
                className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text`}
                placeholder="Phone Number"
                {...register('referredByPhone')}
              />
            </div>
          </div>
        </motion.div>
      )}

      {!isJoiningTenant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 pt-8 border-t border-border mt-6"
        >
          <div className="space-y-1 px-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Protocol Definition</label>
            <p className="text-[10px] text-tertiary-text font-medium">Initializing new society management vector.</p>
          </div>

          <div className="space-y-2 relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Registry Designation</span>
            <input
              type="text"
              className={`w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.coopName ? 'border-red-500/50' : ''}`}
              placeholder="e.g. Nexus Alpha"
              {...register('coopName')}
            />
            {errors.coopName && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.coopName.message}</p>}
          </div>

          <div className="space-y-2 relative group/field">
            <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Desired Subdomain</span>
            <div className="flex items-center">
              <input
                type="text"
                className={`flex-1 bg-surface border border-border rounded-l-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text ${errors.subdomain ? 'border-red-500/50' : ''}`}
                placeholder="nexus-a"
                {...register('subdomain')}
              />
              <div className="bg-surface border border-l-0 border-border rounded-r-2xl p-6 pt-10 text-tertiary-text text-[10px] font-black uppercase tracking-widest">
                .{baseDomain}
              </div>
            </div>
            {errors.subdomain && <p className="text-[9px] font-black uppercase tracking-widest text-red-500/60 px-4">{errors.subdomain.message}</p>}
          </div>
        </motion.div>
      )}

      <div className="space-y-2 relative group/field">
          <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors z-10">Elevated Authorization (Optional)</span>
        <input
          type="text"
          className="w-full bg-surface border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text"
          placeholder="Access key"
          {...register('superAdminKey')}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:tracking-[0.6em] transition-all duration-500 mt-6 disabled:opacity-50"
      >
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {isJoiningTenant ? 'Activate Membership' : 'Initialize Cooperative'}
        </span>
        {loading && (
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
              <span className="text-[13px] font-roboto tracking-wide">Sign up with Google</span>
            </button>
          </div>
        </div>
      )}

      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-surface border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
            <h3 className="text-2xl font-black mb-2 text-primary-text">Complete Profile</h3>
            <p className="text-xs text-tertiary-text mb-6">Just one more step to finish your cooperative account.</p>
            
            <div className="space-y-4">
              <div className="space-y-2 relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Phone Number</span>
                <input
                  type="tel"
                  value={googlePhone}
                  onChange={e => setGooglePhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text"
                  placeholder="08031234567"
                />
              </div>

              <div className="space-y-2 relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Referred By Name (Optional)</span>
                <input
                  type="text"
                  value={googleRefName}
                  onChange={e => setGoogleRefName(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text"
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2 relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Referred By Phone (Optional)</span>
                <input
                  type="tel"
                  value={googleRefPhone}
                  onChange={e => setGoogleRefPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-2xl p-6 pt-10 text-primary-text text-xs outline-none focus:border-primary transition-all font-bold placeholder:text-tertiary-text"
                  placeholder="Phone"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCompletionModal(false)} className="flex-1 py-4 rounded-2xl border border-border font-black text-[11px] uppercase tracking-widest text-tertiary-text hover:text-white transition-colors">Cancel</button>
                <button type="button" onClick={submitGoogleSignup} disabled={loading} className="flex-1 py-4 rounded-2xl bg-primary font-black text-[11px] uppercase tracking-widest text-white hover:bg-primary/90 transition-colors">Complete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}