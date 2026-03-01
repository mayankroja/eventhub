import useSWR from 'swr';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export function useUserRegistrations() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    user ? '/registrations/me' : null,
    (url) => api.get(url).then((res) => res.data)
  );

  return {
    registrations: data || [],
    isLoading,
    error,
    mutate,
  };
}