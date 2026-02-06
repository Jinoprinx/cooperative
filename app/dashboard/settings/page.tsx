'use client';

import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

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
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-display font-bold mb-8">Cooperative Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-8 bg-surface/50 dark:bg-surface/40 p-8 rounded-2xl border border-border backdrop-blur-xl shadow-xl">
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-primary-light">General Information</h2>
                    <div>
                        <label className="block text-sm font-medium mb-1">Cooperative Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-surface dark:bg-black/40 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-primary-light">Branding & Look</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="h-10 w-20 bg-transparent cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                    className="flex-1 bg-surface dark:bg-black/40 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Logo URL</label>
                            <input
                                type="text"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                className="w-full bg-surface dark:bg-black/40 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-primary-light">Loan Configurations</h2>
                    <div>
                        <input
                            type="number"
                            value={formData.maxApprovalAmount}
                            onChange={(e) => setFormData({ ...formData, maxApprovalAmount: parseInt(e.target.value) })}
                            className="w-full bg-surface dark:bg-black/40 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-foreground"
                        />
                    </div>
                </section>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                    >
                        {loading ? <span className="loading loading-spinner loading-sm"></span> : null}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
