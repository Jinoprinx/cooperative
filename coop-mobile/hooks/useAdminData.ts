import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { AdminStats } from '../types';
import { useAuth } from '../context/AuthContext';

export function useAdminData() {
  const { isAuthenticated } = useAuth();

  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data as AdminStats;
    },
    enabled: isAuthenticated,
    staleTime: 0,              // Always treat data as stale — refetch on every mount
    refetchOnMount: 'always',  // Refetch even if data is cached when screen is visited
    refetchInterval: 30_000,   // Auto-refresh every 30 seconds while on the dashboard
  });

  return { 
    stats, 
    isLoading, 
    error: error ? 'Failed to load admin metrics' : null, 
    refetch 
  };
}

