import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

export function useUser() {
  const { user: initialUser, isAuthenticated } = useAuth();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      // Backend returns { success: true, user: {...} } or just the user
      return res.data.user || res.data;
    },
    initialData: initialUser || undefined,
    enabled: isAuthenticated, // Only run if authenticated
  });

  return { 
    user, 
    isLoading, 
    error: error ? 'Failed to fetch user profile' : null, 
    refetch 
  };
}
