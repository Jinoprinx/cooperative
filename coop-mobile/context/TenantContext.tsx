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
  refreshTenantDetails: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<{ subdomain: string; name: string } | null>(null);
  const [tenantDetails, setTenantDetails] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTenantDetails = async () => {
    if (!tenant?.subdomain) return;
    try {
      const res = await api.get(`/tenants/resolve?subdomain=${tenant.subdomain}`);
      setTenantDetails(res.data);
    } catch (e) {
      console.warn('Could not refresh tenant details', e);
    }
  };
// ... existing load logic ...
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await storage.getTenant();
        console.log('[TenantContext] Stored tenant from SecureStore:', stored);
        if (stored) {
          setTenant(stored);
          try {
            const res = await api.get(`/tenants/resolve?subdomain=${stored.subdomain}`);
            console.log('[TenantContext] Resolved tenant details:', res.data?.name);
            setTenantDetails(res.data);
          } catch (e: any) {
            console.warn('[TenantContext] Could not load tenant details on mount:', e?.message || e);
          }
        } else {
          console.log('[TenantContext] No tenant stored — showing landing screen');
        }
      } catch (e: any) {
        console.error('[TenantContext] Error reading stored tenant:', e?.message || e);
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
    console.log('[TenantContext] Searching tenants for:', q);
    try {
      const res = await api.get(`/tenants/search?q=${encodeURIComponent(q)}`);
      console.log('[TenantContext] Search results count:', Array.isArray(res.data) ? res.data.length : 'non-array response');
      return Array.isArray(res.data) ? res.data : [];
    } catch (e: any) {
      console.error('[TenantContext] Search failed:', e?.message || e);
      throw e;
    }
  };

  return (
    <TenantContext.Provider
      value={{ tenant, tenantDetails, isLoading, setActiveTenant, clearTenant, searchTenants, refreshTenantDetails }}
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
