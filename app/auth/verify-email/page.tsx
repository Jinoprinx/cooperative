'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLayout from '@/app/components/auth/AuthLayout';
import { FaEnvelope, FaCircleNotch, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timer, setTimer] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            router.push('/auth/register');
        }
    }, [email, router]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = code.join('');
        if (otp.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
                email,
                code: otp
            });

            setSuccess(response.data.message);
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setResending(true);
        setError('');
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-code`, { email });
            setSuccess('Verification code resent!');
            setTimer(60);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FaEnvelope className="text-2xl text-primary" />
                </div>
                <p className="text-white/60 text-sm">
                    We've sent a 6-digit verification code to <br />
                    <span className="text-white font-medium">{email}</span>
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-between gap-2">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs text-center font-medium"
                        >
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-xs text-center font-medium"
                        >
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="submit"
                    disabled={loading || code.some(d => !d)}
                    className="btn-primary w-full py-4 relative overflow-hidden group disabled:opacity-50"
                >
                    <span className={loading ? 'opacity-0' : 'opacity-100 font-bold'}>Verify Email</span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FaCircleNotch className="animate-spin" />
                        </div>
                    )}
                </button>

                <div className="text-center space-y-4">
                    <p className="text-xs text-white/40">
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={timer > 0 || resending}
                            className={`text-primary font-bold hover:underline transition-all ${timer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {resending ? 'Resending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                        </button>
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push('/auth/register')}
                        className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-white transition-colors mx-auto"
                    >
                        <FaArrowLeft className="text-[10px]" />
                        Back to registration
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <AuthLayout
            title="Verify your Email"
            subtitle="Enter the code sent to your inbox"
            linkText="Sign in"
            linkHref="/auth/login"
        >
            <Suspense fallback={<div className="flex justify-center p-8"><FaCircleNotch className="animate-spin text-2xl text-primary" /></div>}>
                <VerifyEmailContent />
            </Suspense>
        </AuthLayout>
    );
}
