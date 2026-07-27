'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaKey, 
  FaPlus, 
  FaRegCopy, 
  FaCheck, 
  FaTrash, 
  FaInfoCircle, 
  FaCalendarAlt, 
  FaGlobe, 
  FaBan, 
  FaExclamationTriangle,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function OverrideCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generator states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [reason, setReason] = useState('');
  
  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [codesRes, tenantsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/override-codes`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/tenants`, { headers })
      ]);
      
      setCodes(codesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error('Error fetching override data:', error);
      toast.error('Failed to load override codes or tenants list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/override-codes`,
        {
          tenantId: selectedTenantId || undefined,
          durationDays,
          reason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Override code successfully generated');
      setShowGenerateModal(false);
      
      // Reset form
      setSelectedTenantId('');
      setDurationDays(30);
      setReason('');
      
      // Refresh list
      fetchData();
    } catch (error: any) {
      console.error('Error generating code:', error);
      const msg = error.response?.data?.message || 'Failed to generate override code';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeCode = async (codeId: string, codeString: string) => {
    if (!window.confirm(`Are you sure you want to revoke the code "${codeString}"? It will no longer be usable.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/override-codes/${codeId}/revoke`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Override code successfully revoked');
      fetchData();
    } catch (error: any) {
      console.error('Error revoking code:', error);
      const msg = error.response?.data?.message || 'Failed to revoke override code';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Synchronizing Secure Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight mb-4">
            Subscription <span className="text-amber-500">Override Codes</span>
          </h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed">
            Generate and manage one-time bypass keys that override subscription payment checks. 
            Active codes can be redeemed to instantly restore cooperative access for a specific duration.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-amber-500 text-black px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
        >
          <FaPlus /> Generate Code
        </button>
      </div>

      {/* Main Grid: Statistics & History */}
      <div className="space-y-8">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 overflow-hidden">
          <div className="mb-8">
            <h3 className="text-xl font-black tracking-tight">Active Override Log</h3>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Audit Trail & Credentials Registry</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                  <th className="pb-6 pl-4">Override Key</th>
                  <th className="pb-6">Target Eligibility</th>
                  <th className="pb-6">Duration</th>
                  <th className="pb-6">Created By</th>
                  <th className="pb-6">Status</th>
                  <th className="pb-6">Redemption Audit</th>
                  <th className="pb-6 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {codes.map((item) => {
                  const isActive = item.status === 'active';
                  const isUsed = item.status === 'used';
                  const isRevoked = item.status === 'revoked';

                  return (
                    <tr key={item._id} className="text-sm hover:bg-white/[0.01] transition-all">
                      {/* Code */}
                      <td className="py-6 pl-4 font-mono font-black text-white">
                        <div className="flex items-center gap-3">
                          <span className={`${isActive ? 'text-amber-400 font-extrabold drop-shadow-[0_0_6px_rgba(245,158,11,0.2)]' : 'text-white/40 line-through'}`}>
                            {item.code}
                          </span>
                          {isActive && (
                            <button
                              onClick={() => handleCopy(item.code)}
                              className="text-white/20 hover:text-amber-500 transition-colors p-1"
                              title="Copy code"
                            >
                              {copiedCode === item.code ? <FaCheck className="text-emerald-500 text-xs" /> : <FaRegCopy className="text-xs" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-6">
                        {item.tenantId ? (
                          <div>
                            <p className="font-bold text-white/80">{item.tenantId.name}</p>
                            <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-widest">{item.tenantId.subdomain}.cooperatives.io</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-white/40">
                            <FaGlobe className="text-xs" />
                            <span className="text-xs font-semibold">Global / Any Tenant</span>
                          </div>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-6 font-bold text-white/70">
                        {item.durationDays} days
                      </td>

                      {/* Created By */}
                      <td className="py-6 text-xs text-white/50 font-medium">
                        {item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'System'}
                      </td>

                      {/* Status */}
                      <td className="py-6">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                            : isUsed 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Redemption audit */}
                      <td className="py-6 text-xs">
                        {isUsed ? (
                          <div>
                            <p className="font-bold text-amber-500/80">Redeemed by {item.usedByTenant?.name || 'Tenant'}</p>
                            <p className="text-[10px] text-white/30 font-medium">On {new Date(item.usedAt).toLocaleDateString('en-GB')} at {new Date(item.usedAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        ) : isRevoked ? (
                          <span className="text-white/20 italic">Revoked / Invalidated</span>
                        ) : (
                          <span className="text-white/30 flex items-center gap-1.5">
                            <FaInfoCircle className="text-[10px]" /> Awaiting redemption
                          </span>
                        )}
                        {item.reason && (
                          <p className="text-[10px] text-white/40 mt-1 max-w-[200px] truncate" title={item.reason}>
                            Note: {item.reason}
                          </p>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-6 text-right pr-4">
                        {isActive && (
                          <button
                            onClick={() => handleRevokeCode(item._id, item.code)}
                            className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 transition-all p-3 rounded-xl text-xs"
                            title="Revoke code"
                          >
                            <FaBan />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {codes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-white/25 font-black uppercase tracking-widest text-xs">
                      No override codes registered. Generate one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* GENERATE CODE MODAL                         */}
      {/* ============================================ */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setShowGenerateModal(false)} />
          <div className="relative bg-[#0a0a0a] border border-amber-500/20 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl shadow-amber-500/5">
            
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Icon */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <FaKey className="text-amber-500 text-2xl" />
              </div>
              <div>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1">Security Credentials</p>
                <h3 className="text-xl font-black text-white tracking-tight">Generate Override Key</h3>
              </div>
            </div>

            {/* Warning Info */}
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mb-6">
              <FaExclamationTriangle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-500/80 text-xs font-medium leading-relaxed">
                Override codes bypass the billing scheduler payment checkpoints. They are intended for emergency, trial, or custom contract activations. Every generation and redemption is cryptographically traced.
              </p>
            </div>

            <form onSubmit={handleGenerateCode} className="space-y-6">
              {/* Target Tenant (Optional) */}
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                  Target Cooperative (Optional)
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-amber-500/50 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="">Global / Redeemable by Any Tenant</option>
                  {tenants.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.subdomain}.cooperatives.io)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-white/20 mt-1.5 ml-1">If unspecified, this code can be used to override the subscription of any cooperative.</p>
              </div>

              {/* Duration & Reason grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Duration */}
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

                {/* Info summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Calculated Scope</p>
                  <p className="text-white font-black text-sm">{durationDays} Days Free Access</p>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide mt-0.5">Bypasses Paystack</p>
                </div>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] block mb-2">
                  Override Purpose / Notes
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Approved bank transfer, VIP contract, or trial extension request..."
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-2xl py-4 px-6 text-white font-medium outline-none focus:border-amber-500/50 transition-all text-sm resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  className="flex-1 bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-[2] bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <FaKey className={generating ? 'animate-spin' : ''} />
                  {generating ? 'Compiling Security Key...' : 'Confirm & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
