'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaLock, FaExclamationTriangle, FaCreditCard, FaEnvelope } from 'react-icons/fa';

export default function SuspendedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    // Fetch stats to get billing info — /stats is exempt from suspension enforcement
    const fetchBilling = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBilling(res.data.billing);
      } catch {
        // Silently fail — the page still works without billing details
      }
    };
    fetchBilling();
  }, []);

  const handlePay = async () => {
    try {
      setPaying(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/initialize`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Background mesh */}
      <div className="fixed inset-0 z-0 bg-[var(--mesh-gradient)] opacity-20 pointer-events-none" />
      <div className="noise-overlay" />

      {/* Pulsing red glow behind card */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-red-500/5 blur-[120px] animate-pulse pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header status bar */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.5em]">
            Access Suspended
          </span>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>

        {/* Main card */}
        <div className="glass-card rounded-[3rem] border border-red-500/20 bg-red-500/5 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/30 mb-8 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <FaLock className="text-red-500 text-4xl" />
            </div>

            <h1 className="text-4xl font-black text-primary-text tracking-tighter mb-3">
              Subscription <span className="text-red-500">Suspended</span>
            </h1>
            <p className="text-secondary-text font-medium max-w-md mx-auto leading-relaxed mb-2">
              Your cooperative's monthly subscription payment is overdue. All administrative actions
              have been locked until payment is received.
            </p>
            <p className="text-tertiary-text text-sm">
              Members can still log in and view their accounts. Only admin operations are restricted.
            </p>

            {/* Billing breakdown */}
            {billing && billing.tier !== 'free' && (
              <div className="mt-8 bg-surface/50 rounded-2xl border border-border p-6 text-left max-w-sm mx-auto">
                <p className="text-[9px] font-black text-tertiary-text uppercase tracking-widest mb-3">
                  Amount Due
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-text font-medium">
                      ₦{(billing.memberMonthlyRate ?? 300).toLocaleString()} × {billing.memberCount ?? 0} members
                    </span>
                    <span className="text-primary-text font-black">
                      {formatCurrency((billing.memberMonthlyRate ?? 300) * (billing.memberCount ?? 0))}
                    </span>
                  </div>
                  {billing.platformBalance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-text font-medium">Outstanding Balance</span>
                      <span className="text-amber-500 font-black">{formatCurrency(billing.platformBalance)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-border flex justify-between">
                    <span className="text-tertiary-text font-black text-xs uppercase tracking-widest">Total</span>
                    <span className="text-red-500 font-black text-lg">
                      {formatCurrency((billing.platformDues ?? 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm font-medium text-left">{error}</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white font-black px-10 py-4 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <FaCreditCard />
                {paying ? 'Connecting to Payment Gateway...' : 'Pay Now & Restore Access'}
              </button>
            </div>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-tertiary-text text-xs">
                <FaEnvelope className="inline mr-2 opacity-50" />
                Need help? Contact your platform administrator to manually restore access.
              </p>
            </div>
          </div>
        </div>

        {/* Cooperative name tag */}
        <p className="text-center text-tertiary-text text-[10px] font-black uppercase tracking-[0.3em] mt-6">
          Logged in as {user?.firstName} {user?.lastName}
        </p>
      </div>
    </div>
  );
}
