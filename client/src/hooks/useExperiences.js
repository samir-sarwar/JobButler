import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExperiences,
  createExperience as createExperienceApi,
  updateExperience as updateExperienceApi,
  deleteExperience as deleteExperienceApi,
} from '../api';

export function useExperiences(params) {
  const queryClient = useQueryClient();

  const { data: experiences = [], isLoading, error, refetch } = useQuery({
    queryKey: ['experiences', params],
    queryFn: () => fetchExperiences(params),
  });

  const createMutation = useMutation({
    mutationFn: (data) => createExperienceApi(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experiences'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateExperienceApi(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experiences'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExperienceApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['experiences'] }),
  });

  return {
    experiences,
    isLoading,
    error,
    refetch,
    createExperience: createMutation.mutate,
    updateExperience: updateMutation.mutate,
    deleteExperience: deleteMutation.mutate,
  };
}
