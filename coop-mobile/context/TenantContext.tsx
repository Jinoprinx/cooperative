import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../lib/storage';
import { Tenant } from '../types';
import api from '../lib/api';

interface TenantContextType {
  tenant: { subdomain: string; name: string } | null;
  tenantDetails: Tenant | null;
  isLoading: boolean;
  setActiveTenant: (tenant: { subdomain: string; name: string }) => Promise<void>;
  clearTenant: () => Promise<void>;
  searchTenants: (query: string) => Promise<Tenant[]>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<{ subdomain: string; name: string } | null>(null);
  const [tenantDetails, setTenantDetails] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await storage.getTenant();
        if (stored) {
          setTenant(stored);
          try {
            const res = await api.get(`/tenants/resolve?subdomain=${stored.subdomain}`);
            setTenantDetails(res.data);
          } catch (e) {
            console.warn('Could not load tenant details on mount', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const setActiveTenant = async (t: { subdomain: string; name: string }) => {
    await storage.setTenant(t);
    setTenant(t);
    // Fetch full tenant details
    try {
      const res = await api.get(`/tenants/resolve?subdomain=${t.subdomain}`);
      setTenantDetails(res.data);
    } catch (e) {
      console.warn('Could not load tenant details', e);
    }
  };

  const clearTenant = async () => {
    await storage.removeTenant();
    setTenant(null);
    setTenantDetails(null);
  };

  const searchTenants = async (query: string): Promise<Tenant[]> => {
    const q = query.trim();
    if (q.length < 2) return [];
    const res = await api.get(`/tenants/search?q=${encodeURIComponent(q)}`);
    return Array.isArray(res.data) ? res.data : [];
  };

  return (
    <TenantContext.Provider
      value={{ tenant, tenantDetails, isLoading, setActiveTenant, clearTenant, searchTenants }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used inside TenantProvider');
  return context;
}
