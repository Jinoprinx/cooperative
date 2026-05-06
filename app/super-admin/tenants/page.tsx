'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaGlobe, 
  FaPause, 
  FaPlay, 
  FaEye, 
  FaSearch,
  FaCalendarAlt,
  FaUsers,
  FaLockOpen,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBan
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Unblock modal state
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [paymentPassword, setPaymentPassword] = useState('');
  const [unblockReason, setUnblockReason] = useState('');
  const [unblocking, setUnblocking] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load cooperatives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} this cooperative?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${tenantId}/status`, {
        status: nextStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Cooperative successfully ${nextStatus}`);
      fetchTenants();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Operation failed');
    }
  };

  const openUnblockModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setPaymentPassword('');
    setUnblockReason('');
    setShowUnblockModal(true);
  };

  const closeUnblockModal = () => {
    setShowUnblockModal(false);
    setSelectedTenant(null);
    setPaymentPassword('');
    setUnblockReason('');
    setPasswordVisible(false);
  };

  const handleUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !paymentPassword.trim()) return;

    setUnblocking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${selectedTenant._id}/unblock`,
        { paymentPassword, reason: unblockReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      closeUnblockModal();
      fetchTenants();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unblock operation failed';
      toast.error(msg);
    } finally {
      setUnblocking(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: suspended first
  const sortedTenants = [...filteredTenants].sort((a, b) => {
    const aScore = a.billing?.subscriptionStatus === 'suspended' ? -1 : 0;
    const bScore = b.billing?.subscriptionStatus === 'suspended' ? -1 : 0;
    return aScore - bScore;
  });

  const suspendedCount = tenants.filter(t => t.billing?.subscriptionStatus === 'suspended').length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Polling Distributed Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end gap-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight mb-4">Cooperative <span className="text-amber-500">Fleet</span></h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed">
            Manage the global fleet of cooperative tenants. Monitor subscription health, and exercise 
            administrative control including emergency access restoration via billing override.
          </p>
        </div>

        <div className="flex-1 max-w-md relative group">
           <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Search fleet by name or domain..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-xs"
           />
        </div>
      </div>

      {/* Suspended alert banner */}
      {suspendedCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <FaBan className="text-red-500 text-xl" />
          </div>
          <div>
            <p className="text-red-400 font-black text-sm uppercase tracking-widest mb-1">
              {suspendedCount} Suspended Cooperative{suspendedCount > 1 ? 's' : ''}
            </p>
            <p className="text-white/40 text-xs font-medium">
              These tenants have lost access due to non-payment. Use the billing override to manually restore access.
            </p>
          </div>
        </div>
      )}

      {/* Tenant list */}
      <div className="grid grid-cols-1 gap-6">
        {sortedTenants.map((tenant) => {
          const isBillingSuspended = tenant.billing?.subscriptionStatus === 'suspended';
          const isTenantSuspended = tenant.status === 'suspended';

          return (
            <div 
              key={tenant._id} 
              className={`bg-[#0a0a0a] border rounded-[2.5rem] p-8 transition-all duration-500 group relative overflow-hidden ${
                isBillingSuspended 
                  ? 'border-red-500/30 hover:border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.05)]' 
                  : 'border-white/5 hover:border-amber-500/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                {/* Left: Identity */}
                <div className="flex items-center gap-8">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                    isBillingSuspended ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/5 border border-amber-500/10'
                  }`}>
                    {isBillingSuspended 
                      ? <FaBan className="text-red-500 text-3xl opacity-70" />
                      : <FaGlobe className="text-amber-500 text-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    }
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-1">{tenant.name}</h3>
                    <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em]">{tenant.subdomain}.cooperatives.io</p>
                    {isBillingSuspended && (
                      <span className="inline-block mt-2 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        ⚠ Billing Suspended
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 border-l border-white/5 pl-8">
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Fleet Status</span>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      isTenantSuspended 
                        ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isTenantSuspended ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                      {tenant.status || 'Active'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Subscription</span>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      isBillingSuspended
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : tenant.billing?.subscriptionStatus === 'grace_period'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isBillingSuspended ? 'bg-red-500' 
                        : tenant.billing?.subscriptionStatus === 'grace_period' ? 'bg-amber-500 animate-pulse' 
                        : 'bg-emerald-500 animate-pulse'
                      }`} />
                      {tenant.billing?.subscriptionStatus?.replace('_', ' ') || 'Active'}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2">Deployed On</span>
                    <div className="flex items-center gap-2 text-white/60 text-[10px] font-black tracking-widest">
                      <FaCalendarAlt className="text-amber-500/40" />
                      {new Date(tenant.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  <button className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all" title="View details">
                    <FaEye />
                  </button>

                  {/* Billing Override Unblock — only shown when billing is suspended */}
                  {isBillingSuspended && (
                    <button 
                      onClick={() => openUnblockModal(tenant)}
                      className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black"
                      title="Manual billing override"
                    >
                      <FaLockOpen />
                      Override & Unblock
                    </button>
                  )}

                  {/* Fleet suspend/activate toggle (tenant.status) */}
                  <button 
                    onClick={() => toggleStatus(tenant._id, tenant.status || 'active')}
                    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                      isTenantSuspended
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {isTenantSuspended ? <FaPlay /> : <FaPause />}
                    {isTenantSuspended ? 'Activate' : 'Suspend'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedTenants.length === 0 && (
          <div className="text-center py-20 text-white/20 font-black uppercase tracking-widest text-sm">
            No cooperatives found
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BILLING OVERRIDE UNBLOCK MODAL               */}
      {/* ============================================ */}
      {showUnblockModal && selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={closeUnblockModal} />
          <div className="relative bg-[#0a0a0a] border border-amber-500/20 rounded-[3rem] p-10 w-full max-w-md shadow-2xl shadow-amber-500/5">
            
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <FaShieldAlt className="text-amber-500 text-2xl" />
              </div>
              <div>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1">Billing Override</p>
                <h3 className="text-xl font-black text-white tracking-tight">Unblock Cooperative</h3>
              </div>
            </div>

            {/* Cooperative name */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6">
              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Target</p>
              <p className="text-white font-black">{selectedTenant.name}</p>
              <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest">{selectedTenant.subdomain}.cooperatives.io</p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mb-6">
              <FaExclamationTriangle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-500/80 text-xs font-medium leading-relaxed">
                This action bypasses the payment requirement and grants the cooperative a 30-day billing extension. 
                All override actions are logged.
              </p>
            </div>

            <form onSubmit={handleUnblock} className="space-y-5">
              {/* Override password */}
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                  Billing Override Password *
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    value={paymentPassword}
                    onChange={(e) => setPaymentPassword(e.target.value)}
                    placeholder="Enter override password"
                    required
                    autoComplete="off"
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-sm pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                  Reason / Notes (Optional)
                </label>
                <textarea
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  placeholder="e.g. Payment confirmed via bank transfer, awaiting webhook..."
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-medium outline-none focus:border-amber-500/50 transition-all text-sm resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeUnblockModal}
                  disabled={unblocking}
                  className="flex-1 bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!paymentPassword.trim() || unblocking}
                  className="flex-[2] bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <FaLockOpen className={unblocking ? 'animate-spin' : ''} />
                  {unblocking ? 'Verifying & Unblocking...' : 'Confirm Override & Unblock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
