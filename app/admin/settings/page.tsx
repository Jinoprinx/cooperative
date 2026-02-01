'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { FaPalette, FaCog, FaHandHolding, FaSave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function SettingsPage() {
    const { tenant, refreshTenant } = useTenant();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Cooperative Settings</h1>
                <p className="mt-2 text-gray-600">Customize your cooperative's branding and operational rules.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <FaCheckCircle className="mr-3" /> : <FaExclamationCircle className="mr-3" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Info */}
                <section className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-6 border-b pb-4">
                        <FaCog className="text-primary text-xl mr-3" />
                        <h2 className="text-xl font-semibold text-gray-800">General Information</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cooperative Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="registrationOpen"
                                checked={formData.settings.registrationOpen}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    settings: { ...formData.settings, registrationOpen: e.target.checked }
                                })}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="registrationOpen" className="ml-2 block text-sm text-gray-900">
                                Member Registration Open
                            </label>
                        </div>
                    </div>
                </section>

                {/* Branding */}
                <section className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-6 border-b pb-4">
                        <FaPalette className="text-primary text-xl mr-3" />
                        <h2 className="text-xl font-semibold text-gray-800">Branding</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                            <div className="mt-1 flex items-center space-x-2">
                                <input
                                    type="color"
                                    name="primaryColor"
                                    value={formData.branding.primaryColor}
                                    onChange={handleBrandingChange}
                                    className="h-10 w-20 p-1 border rounded"
                                />
                                <input
                                    type="text"
                                    name="primaryColor"
                                    value={formData.branding.primaryColor}
                                    onChange={handleBrandingChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                            <div className="mt-1 flex items-center space-x-2">
                                <input
                                    type="color"
                                    name="accentColor"
                                    value={formData.branding.accentColor}
                                    onChange={handleBrandingChange}
                                    className="h-10 w-20 p-1 border rounded"
                                />
                                <input
                                    type="text"
                                    name="accentColor"
                                    value={formData.branding.accentColor}
                                    onChange={handleBrandingChange}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                            <input
                                type="url"
                                name="logoUrl"
                                value={formData.branding.logoUrl}
                                onChange={handleBrandingChange}
                                placeholder="https://example.com/logo.png"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                </section>

                {/* Loan Rules */}
                <section className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-6 border-b pb-4">
                        <FaHandHolding className="text-primary text-xl mr-3" />
                        <h2 className="text-xl font-semibold text-gray-800">Loan Policies</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Loan Amount</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">₦</span>
                                </div>
                                <input
                                    type="number"
                                    name="maxApprovalAmount"
                                    value={formData.settings.loanRules.maxApprovalAmount}
                                    onChange={handleLoanRulesChange}
                                    className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                            <input
                                type="number"
                                name="interestRate"
                                step="0.1"
                                value={formData.settings.loanRules.interestRate}
                                onChange={handleLoanRulesChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : <FaSave className="mr-2" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
