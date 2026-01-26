'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantBranding {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
}

interface TenantSettings {
    loanRules?: {
        maxApprovalAmount: number;
        interestRate: number;
    };
    registrationOpen: boolean;
}

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    branding: TenantBranding;
    settings: TenantSettings;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, initialTenant }: { children: React.ReactNode, initialTenant?: Tenant }) {
    const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
    const [loading, setLoading] = useState(!initialTenant);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!initialTenant) {
            // In a real app, you might fetch tenant data here if not provided via props
            // For now, we assume it's passed from the root layout (server-side)
            setLoading(false);
        }
    }, [initialTenant]);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
            {tenant?.branding?.primaryColor && (
                <style jsx global>{`
          :root {
            --primary-color: ${tenant.branding.primaryColor};
            --accent-color: ${tenant.branding.accentColor || '#f59e0b'};
            --font-family: ${tenant.branding.fontFamily || 'Inter'};
          }
        `}</style>
            )}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
