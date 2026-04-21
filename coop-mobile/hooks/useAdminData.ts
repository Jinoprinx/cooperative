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
  });

  return { 
    stats, 
    isLoading, 
    error: error ? 'Failed to load admin metrics' : null, 
    refetch 
  };
}
