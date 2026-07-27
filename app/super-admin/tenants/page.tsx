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
  FaBan,
  FaBuilding,
  FaPalette,
  FaCreditCard,
  FaEnvelope,
  FaCog,
  FaUniversity,
  FaTimes
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TenantManagement() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Unblock modal state
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [overrideCode, setOverrideCode] = useState('');
  const [unblockReason, setUnblockReason] = useState('');
  const [unblocking, setUnblocking] = useState(false);

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsTenant, setDetailsTenant] = useState<any>(null);

  // Auto-apply state additions
  const [activeCodes, setActiveCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [unblockMode, setUnblockMode] = useState<'existing' | 'generate'>('existing');
  const [durationDays, setDurationDays] = useState(30);

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

  const openUnblockModal = async (tenant: any) => {
    setSelectedTenant(tenant);
    setOverrideCode('');
    setUnblockReason('');
    setUnblockMode('existing');
    setDurationDays(30);
    setShowUnblockModal(true);
    
    setLoadingCodes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/override-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eligible = response.data.filter((c: any) => 
        c.status === 'active' && 
        (!c.tenantId || c.tenantId._id === tenant._id)
      );
      setActiveCodes(eligible);
    } catch (err) {
      console.error('Failed to fetch active override codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const closeUnblockModal = () => {
    setShowUnblockModal(false);
    setSelectedTenant(null);
    setOverrideCode('');
    setUnblockReason('');
    setActiveCodes([]);
  };

  const handleUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    if (unblockMode === 'existing' && !overrideCode.trim()) {
      toast.error('Please select an override code');
      return;
    }

    setUnblocking(true);
    try {
      const token = localStorage.getItem('token');
      const payload = unblockMode === 'existing'
        ? { overrideCode: overrideCode.trim(), reason: unblockReason }
        : { autoGenerate: true, durationDays, reason: unblockReason };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants/${selectedTenant._id}/unblock`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      closeUnblockModal();
      fetchTenants();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Override operation failed';
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
                  <button 
                    onClick={() => {
                      setDetailsTenant(tenant);
                      setShowDetailsModal(true);
                    }}
                    className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all" 
                    title="View details"
                  >
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
            </div>            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mb-6">
              <FaExclamationTriangle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-500/80 text-xs font-medium leading-relaxed">
                This action bypasses the payment requirement. Select an existing override code or generate a new one on-the-fly.
              </p>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-2 gap-2 bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setUnblockMode('existing')}
                className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  unblockMode === 'existing'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                Use Existing Code
              </button>
              <button
                type="button"
                onClick={() => setUnblockMode('generate')}
                className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  unblockMode === 'generate'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                Generate On-the-fly
              </button>
            </div>

            <form onSubmit={handleUnblock} className="space-y-5">
              {unblockMode === 'existing' ? (
                <div>
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                    Select Active Override Code *
                  </label>
                  {loadingCodes ? (
                    <div className="py-4 text-center text-white/40 text-xs font-bold animate-pulse">
                      Polling eligible codes...
                    </div>
                  ) : activeCodes.length > 0 ? (
                    <select
                      value={overrideCode}
                      onChange={(e) => setOverrideCode(e.target.value)}
                      required
                      className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                      <option value="">-- Choose an active code --</option>
                      {activeCodes.map((c) => (
                        <option key={c._id} value={c.code}>
                          {c.code} ({c.durationDays} Days{c.reason ? ` - ${c.reason}` : ''})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center text-xs text-red-500 font-bold">
                      No active codes found for this cooperative. Create one in the Override Codes tab or choose "Generate On-the-fly".
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                    Extension Duration *
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    required
                    className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value={7}>7 Days (Trial/Buffer)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (3 Months)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={360}>360 Days (1 Year)</option>
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                  Reason / Notes {unblockMode === 'generate' ? '*' : '(Optional)'}
                </label>
                <textarea
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  placeholder={unblockMode === 'generate' ? "Specify reason for on-the-fly generation..." : "e.g. Payment confirmed via bank transfer..."}
                  required={unblockMode === 'generate'}
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
                  disabled={unblocking || (unblockMode === 'existing' && (!overrideCode || activeCodes.length === 0))}
                  className="flex-[2] bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <FaLockOpen className={unblocking ? 'animate-spin' : ''} />
                  {unblocking 
                    ? 'Processing...' 
                    : unblockMode === 'existing' 
                    ? 'Redeem & Unblock' 
                    : 'Generate, Redeem & Unblock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TENANT DETAILS MODAL                        */}
      {/* ============================================ */}
      {showDetailsModal && detailsTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 w-full max-w-4xl shadow-2xl shadow-amber-500/5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                  <FaBuilding className="text-amber-500 text-2xl" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1">Cooperative Dossier</p>
                  <h3 className="text-3xl font-black text-white tracking-tight">{detailsTenant.name}</h3>
                  <p className="text-xs text-white/40 font-medium">{detailsTenant.subdomain}.cooperatives.io</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="bg-white/5 border border-white/10 p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
              
              {/* Box 1: Subscription & Financials */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <FaCreditCard className="text-amber-500 text-lg opacity-80" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Subscription & Financials</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Tier</span>
                    <span className="text-xs font-black uppercase text-amber-500">{detailsTenant.billing?.tier || 'Free'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Billing Status</span>
                    <div>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        detailsTenant.billing?.subscriptionStatus === 'suspended'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : detailsTenant.billing?.subscriptionStatus === 'grace_period'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {detailsTenant.billing?.subscriptionStatus || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Platform Balance</span>
                    <span className="text-xs font-bold">₦{(detailsTenant.billing?.platformBalance || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Rebate Reserve</span>
                    <span className="text-xs font-bold">₦{(detailsTenant.billing?.rebateReserve || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Last Billed</span>
                    <span className="text-xs text-white/70 font-medium">
                      {detailsTenant.billing?.lastBillingDate ? new Date(detailsTenant.billing.lastBillingDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Next Bill Date</span>
                    <span className="text-xs text-white/70 font-medium">
                      {detailsTenant.billing?.nextBillingDate ? new Date(detailsTenant.billing.nextBillingDate).toLocaleDateString('en-GB') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Auto Bill</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.billing?.isAutoBillEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Card Last 4</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.billing?.cardLast4 ? `•••• ${detailsTenant.billing.cardLast4}` : 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Settings & Loan Rules */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <FaCog className="text-amber-500 text-lg opacity-80" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Loan Rules & Settings</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Max Loan Approval</span>
                    <span className="text-xs font-bold">₦{(detailsTenant.settings?.loanRules?.maxApprovalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Interest Rate</span>
                    <span className="text-xs font-bold">{detailsTenant.settings?.loanRules?.interestRate || 0}%</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Deduct Interest at Source</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.settings?.loanRules?.deductInterestAtSource ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Registration Open</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.settings?.registrationOpen ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Share Capital Min</span>
                    <span className="text-xs font-bold">₦{(detailsTenant.settings?.paymentAllocation?.shareCapitalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Thrift Savings Min</span>
                    <span className="text-xs font-bold">₦{(detailsTenant.settings?.paymentAllocation?.thriftSavingsAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Capital Mobilization</span>
                    <span className="text-xs font-medium text-white/70">
                      {detailsTenant.settings?.paymentAllocation?.capitalMobilization?.enabled 
                        ? `Enabled (${detailsTenant.settings.paymentAllocation.capitalMobilization.name || 'Capital Mobilization'})` 
                        : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Branding & Email Configurations */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <FaPalette className="text-amber-500 text-lg opacity-80" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Branding & Email</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Primary Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: detailsTenant.branding?.primaryColor || '#3b82f6' }} />
                      <span className="text-xs font-mono">{detailsTenant.branding?.primaryColor || '#3b82f6'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Accent Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: detailsTenant.branding?.accentColor || '#f59e0b' }} />
                      <span className="text-xs font-mono">{detailsTenant.branding?.accentColor || '#f59e0b'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Font Family</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.branding?.fontFamily || 'Inter'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Custom Domain</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.customDomain || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Email Sender Name</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.emailConfig?.senderName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Email Sender Address</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.emailConfig?.senderEmail || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Bank Details & Metadata */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <FaUniversity className="text-amber-500 text-lg opacity-80" />
                  <h4 className="font-black text-sm uppercase tracking-widest">Bank Details & Info</h4>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Bank Name</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.bankDetails?.bankName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Account Number</span>
                    <span className="text-xs font-bold text-white/70">{detailsTenant.bankDetails?.accountNumber || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Account Name</span>
                    <span className="text-xs font-medium text-white/70">{detailsTenant.bankDetails?.accountName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Deployed On</span>
                    <span className="text-xs font-medium text-white/70">{new Date(detailsTenant.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Fleet Status</span>
                    <div>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                        detailsTenant.status === 'suspended'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {detailsTenant.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Panel */}
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h4 className="font-black text-sm uppercase tracking-widest mb-1">Dossier Access Controls</h4>
                <p className="text-white/40 text-[10px] font-medium">Perform high-priority system actions on this cooperative node.</p>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                {/* Billing Override */}
                {detailsTenant.billing?.subscriptionStatus === 'suspended' && (
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      openUnblockModal(detailsTenant);
                    }}
                    className="flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-black"
                  >
                    <FaLockOpen />
                    Override Billing
                  </button>
                )}

                {/* Fleet suspend/activate toggle */}
                <button 
                  onClick={async () => {
                    const currentStatus = detailsTenant.status || 'active';
                    await toggleStatus(detailsTenant._id, currentStatus);
                    // update detailsTenant in real time
                    const updatedTenant = { ...detailsTenant, status: currentStatus === 'active' ? 'suspended' : 'active' };
                    setDetailsTenant(updatedTenant);
                  }}
                  className={`flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    detailsTenant.status === 'suspended'
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  {detailsTenant.status === 'suspended' ? <FaPlay /> : <FaPause />}
                  {detailsTenant.status === 'suspended' ? 'Activate Fleet' : 'Suspend Fleet'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
