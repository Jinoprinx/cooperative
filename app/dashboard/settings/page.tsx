'use client';

import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { FaCog, FaPalette, FaShieldAlt, FaSave } from 'react-icons/fa';

export default function SettingsPage() {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: tenant?.name || '',
        logoUrl: tenant?.branding?.logoUrl || '',
        primaryColor: tenant?.branding?.primaryColor || '#3b82f6',
        maxApprovalAmount: tenant?.settings?.loanRules?.maxApprovalAmount || 500000,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.patch('/tenants', {
                name: formData.name,
                branding: {
                    logoUrl: formData.logoUrl,
                    primaryColor: formData.primaryColor,
                },
                settings: {
                    loanRules: {
                        maxApprovalAmount: formData.maxApprovalAmount,
                    }
                }
            });
            toast.success('Settings updated successfully!');
            // Refresh page to apply new theme
            window.location.reload();
        } catch (error) {
            console.error('Update settings error:', error);
            toast.error('Failed to update settings.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 text-primary-text pb-20">
            <div className="mb-10">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">System Configuration</span>
              <h1 className="text-4xl font-black tracking-tighter">Cooperative <span className="text-tertiary-text">Settings</span></h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 card-premium bg-surface border border-border p-8 rounded-[2.5rem]">
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <FaCog className="text-primary" />
                       <h2 className="text-lg font-black tracking-tighter uppercase">General Information</h2>
                    </div>
                    <div className="relative group/field">
                        <label className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-widest group-focus-within/field:text-primary transition-colors">Cooperative Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-surface-lighter border border-border rounded-2xl px-6 pt-8 pb-4 text-primary-text outline-none focus:border-primary transition-all font-bold"
                        />
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <FaPalette className="text-primary" />
                       <h2 className="text-lg font-black tracking-tighter uppercase">Branding & Aesthetics</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group/field">
                            <label className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-widest group-focus-within/field:text-primary transition-colors">Primary Protocol Color</label>
                            <div className="flex gap-3 bg-surface-lighter border border-border rounded-2xl px-4 pt-8 pb-4">
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="h-10 w-20 bg-transparent cursor-pointer rounded-lg border border-border overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="flex-1 bg-transparent text-primary-text outline-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="relative group/field">
                            <label className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-widest group-focus-within/field:text-primary transition-colors">Logo Vector URL</label>
                            <input
                                type="text"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                className="w-full bg-surface-lighter border border-border rounded-2xl px-6 pt-8 pb-4 text-primary-text outline-none focus:border-primary transition-all font-bold"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                       <FaShieldAlt className="text-primary" />
                       <h2 className="text-lg font-black tracking-tighter uppercase">Credit Thresholds</h2>
                    </div>
                    <div className="relative group/field">
                        <label className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-widest group-focus-within/field:text-primary transition-colors">Maximum Approval Ceiling (NGN)</label>
                        <input
                            type="number"
                            value={formData.maxApprovalAmount}
                            onChange={(e) => setFormData({ ...formData, maxApprovalAmount: parseInt(e.target.value) })}
                            className="w-full bg-surface-lighter border border-border rounded-2xl px-6 pt-8 pb-4 text-primary-text outline-none focus:border-primary transition-all font-black"
                        />
                    </div>
                </section>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-5 rounded-2xl flex justify-center items-center gap-3 text-xs font-black uppercase tracking-[0.4em] shadow-none border-none"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FaSave className="h-4 w-4" />}
                        Save System Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
