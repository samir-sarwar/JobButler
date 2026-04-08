import { useQuery } from '@tanstack/react-query';
import { fetchSessions } from '../api';

export function useSessions({ limit = 20, offset = 0 } = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', { limit, offset }],
    queryFn: () => fetchSessions({ limit, offset }),
  });

  return {
    sessions: data?.sessions ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}
