'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { FaPalette, FaCog, FaHandHolding, FaSave, FaCheckCircle, FaExclamationCircle, FaLock } from 'react-icons/fa';

export default function SettingsPage() {
    const { tenant, refreshTenant } = useTenant();
    const { token, user, updateUser, isMainAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });
    const [pinMessage, setPinMessage] = useState({ type: '', text: '' });
    const [pinLoading, setPinLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        branding: {
            primaryColor: '#3b82f6',
            accentColor: '#f59e0b',
            fontFamily: 'Inter',
            logoUrl: '',
        },
        settings: {
            loanRules: {
                maxApprovalAmount: 500000,
                interestRate: 5,
            },
            registrationOpen: true,
        }
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name || '',
                branding: {
                    primaryColor: tenant.branding?.primaryColor || '#3b82f6',
                    accentColor: tenant.branding?.accentColor || '#f59e0b',
                    fontFamily: tenant.branding?.fontFamily || 'Inter',
                    logoUrl: tenant.branding?.logoUrl || '',
                },
                settings: {
                    loanRules: {
                        maxApprovalAmount: tenant.settings?.loanRules?.maxApprovalAmount || 500000,
                        interestRate: tenant.settings?.loanRules?.interestRate || 5,
                    },
                    registrationOpen: tenant.settings?.registrationOpen ?? true,
                }
            });
        }
    }, [tenant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/tenants`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshTenant();
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error: any) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
        } finally {
            setLoading(false);
        }
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pinData.pin !== pinData.confirmPin) {
            setPinMessage({ type: 'error', text: 'PINs do not match' });
            return;
        }
        if (pinData.pin.length !== 4) {
            setPinMessage({ type: 'error', text: 'PIN must be 4 digits' });
            return;
        }

        setPinLoading(true);
        setPinMessage({ type: '', text: '' });

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/setup-pin`, { pin: pinData.pin }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPinMessage({ type: 'success', text: 'Balance PIN updated successfully!' });
            setPinData({ pin: '', confirmPin: '' });

            if (user) {
                updateUser({ ...user, hasPin: true });
            }
        } catch (error: any) {
            console.error('Error updating PIN:', error);
            setPinMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update PIN' });
        } finally {
            setPinLoading(false);
        }
    };

    const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            branding: { ...prev.branding, [name]: value }
        }));
    };

    const handleLoanRulesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                loanRules: { ...prev.settings.loanRules, [name]: parseFloat(value) }
            }
        }));
    };

    return (
        <div className="space-y-10 pb-20 text-white max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Core Configuration</span>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
                        Cooperative <span className="text-white/40">Nexus</span>
                    </h1>
                </div>
            </div>

            {message.text && (
                <div className={`p-6 rounded-[2rem] flex items-center border animate-float ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                    {message.type === 'success' ? <FaCheckCircle className="mr-3 h-5 w-5" /> : <FaExclamationCircle className="mr-3 h-5 w-5" />}
                    <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            <div className="grid gap-10 lg:grid-cols-2">
                <form onSubmit={handleSubmit} className="lg:col-span-1 space-y-10">
                    {/* General Info */}
                    <div className="card-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                        <div className="flex items-center gap-3 mb-8">
                             <FaCog className="text-primary h-5 w-5" />
                             <h2 className="text-xl font-black tracking-tighter uppercase">General Params</h2>
                        </div>
                        <div className="space-y-8">
                            <div className="relative group/field">
                                <span className="absolute top-2 left-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Registry Designation</span>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pt-8 text-white outline-none focus:border-primary transition-all font-bold"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-white/3 p-6 rounded-2xl border border-white/5 group hover:bg-white/5 transition-all">
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="registrationOpen"
                                        checked={formData.settings.registrationOpen}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            settings: { ...formData.settings, registrationOpen: e.target.checked }
                                        })}
                                        className="absolute w-6 h-6 rounded-full appearance-none cursor-pointer checked:bg-primary border-none left-0 checked:left-6 transition-all duration-300"
                                    />
                                </div>
                                <label htmlFor="registrationOpen" className="text-xs font-black uppercase tracking-widest text-white/60 cursor-pointer group-hover:text-white transition-colors">
                                    Member Intake Protocol Open
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="card-premium relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8">
                             <FaPalette className="text-primary h-5 w-5" />
                             <h2 className="text-xl font-black tracking-tighter uppercase">Visual Identity</h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Dominant Hue</label>
                                <div className="flex items-center gap-3 bg-white/3 p-2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                                    <input
                                        type="color"
                                        name="primaryColor"
                                        value={formData.branding.primaryColor}
                                        onChange={handleBrandingChange}
                                        className="h-12 w-12 rounded-xl cursor-pointer bg-transparent border-none overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        name="primaryColor"
                                        value={formData.branding.primaryColor}
                                        onChange={handleBrandingChange}
                                        className="flex-1 bg-transparent text-xs font-mono font-bold text-white outline-none uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Accent Calibration</label>
                                <div className="flex items-center gap-3 bg-white/3 p-2 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                                    <input
                                        type="color"
                                        name="accentColor"
                                        value={formData.branding.accentColor}
                                        onChange={handleBrandingChange}
                                        className="h-12 w-12 rounded-xl cursor-pointer bg-transparent border-none overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        name="accentColor"
                                        value={formData.branding.accentColor}
                                        onChange={handleBrandingChange}
                                        className="flex-1 bg-transparent text-xs font-mono font-bold text-white outline-none uppercase"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2 space-y-4 mt-4">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Symbol Asset URL</label>
                                <input
                                    type="url"
                                    name="logoUrl"
                                    value={formData.branding.logoUrl}
                                    onChange={handleBrandingChange}
                                    className="w-full bg-white/3 border border-white/5 rounded-2xl p-6 text-white text-xs outline-none focus:border-primary transition-all font-mono"
                                    placeholder="https://assets.nexus.io/logo.svg"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-6 rounded-3xl text-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:tracking-[0.6em] transition-all duration-500"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : <FaSave className="h-5 w-5" />}
                        Flash Update Settings
                    </button>
                </form>

                <div className="lg:col-span-1 space-y-10">
                    {/* Loan Rules */}
                    <div className="card-premium relative overflow-hidden bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3 mb-8">
                             <FaHandHolding className="text-primary h-5 w-5" />
                             <h2 className="text-xl font-black tracking-tighter uppercase text-primary">Credit Algorithms</h2>
                        </div>
                        <div className="space-y-8">
                            <div className="relative group/field">
                                <span className="absolute top-2 left-6 text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] group-focus-within/field:text-white transition-colors">Max Exposure (NGN)</span>
                                <input
                                    type="number"
                                    name="maxApprovalAmount"
                                    value={formData.settings.loanRules.maxApprovalAmount}
                                    onChange={handleLoanRulesChange}
                                    className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-6 pt-8 text-white outline-none focus:border-white transition-all font-black text-2xl tracking-tighter"
                                />
                            </div>
                            <div className="relative group/field">
                                <span className="absolute top-2 left-6 text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] group-focus-within/field:text-white transition-colors">Yield Rate (%)</span>
                                <input
                                    type="number"
                                    name="interestRate"
                                    step="0.1"
                                    value={formData.settings.loanRules.interestRate}
                                    onChange={handleLoanRulesChange}
                                    className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-6 pt-8 text-white outline-none focus:border-white transition-all font-black text-2xl tracking-tighter"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security - PIN Management (Main Admin Only) */}
                    {isMainAdmin && (
                        <div className="card-premium relative overflow-hidden border-red-500/20 bg-red-500/3">
                            <div className="flex items-center gap-3 mb-8 border-b border-red-500/10 pb-6">
                                <FaLock className="text-red-500 h-5 w-5" />
                                <h2 className="text-xl font-black tracking-tighter uppercase text-red-500">Encrypted Logic</h2>
                            </div>

                            {pinMessage.text && (
                                <div className={`mb-8 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                    pinMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                    {pinMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePinSubmit} className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-red-500/40 uppercase tracking-widest ml-4">Vector PIN</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={pinData.pin}
                                            onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '') })}
                                            className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-red-500 transition-all font-mono"
                                            placeholder="****"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-red-500/40 uppercase tracking-widest ml-4">Verification</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            value={pinData.confirmPin}
                                            onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '') })}
                                            className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-red-500 transition-all font-mono"
                                            placeholder="****"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={pinLoading || pinData.pin.length !== 4}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(220,38,38,0.1)]"
                                >
                                    {pinLoading ? 'Protocols Updating...' : 'Refresh Access Vector'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
