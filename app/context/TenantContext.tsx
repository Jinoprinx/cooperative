'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
    _id?: string;
    name: string;
    subdomain: string;
    branding: TenantBranding;
    settings: TenantSettings;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children, initialTenant }: { children: React.ReactNode, initialTenant?: Tenant }) {
    const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
    const [loading, setLoading] = useState(!initialTenant);
    const [error, setError] = useState<string | null>(null);

    const refreshTenant = async () => {
        try {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            let subdomain = '';

            // Handle localhost vs production domains
            if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
                subdomain = parts[0];
            } else if (parts.length > 2) {
                subdomain = parts[0];
            }

            if (subdomain && subdomain !== 'www') {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tenants/resolve?subdomain=${subdomain}`);
                setTenant(response.data);
            }
        } catch (err) {
            console.error('Error refreshing tenant:', err);
        }
    };

    useEffect(() => {
        if (!initialTenant) {
            refreshTenant().finally(() => setLoading(false));
        }
    }, [initialTenant]);

    return (
        <TenantContext.Provider value={{ tenant, loading, error, refreshTenant }}>
            {children}
            {tenant?.branding?.primaryColor && (
                <style jsx global>{`
          :root {
            --primary-color: ${tenant.branding.primaryColor};
            --accent-color: ${tenant.branding.accentColor || '#f59e0b'};
            --primary-dark: ${tenant.branding.primaryColor}dd; /* Sub-color for hover/active */
            --font-family: ${tenant.branding.fontFamily || 'Inter'};
          }
          
          /* Force override for components using branding variables */
          .bg-primary { background-color: var(--primary-color) !important; }
          .text-primary { color: var(--primary-color) !important; }
          .hover\:bg-primary-light:hover { background-color: var(--primary-color); opacity: 0.9; }
          .bg-primary-dark { background-color: var(--primary-color); filter: brightness(0.8); }
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
