import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  checkConnection,
  ConnectionStatus,
  createTask,
  deleteTask,
  fetchTaskById,
  fetchTasks,
  updateTask,
} from '../services/api-client';
import { getStoredConfig } from '../services/api-config';
import { CreateTaskInput, TaskFilterParams, TasksResponse, UpdateTaskInput } from '../types/task';

export const TASKS_QUERY_KEY = ['tasks'] as const;

export function useTasks(params: TaskFilterParams = {}) {
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    const handler = () => setConfigVersion((v) => v + 1);
    window.addEventListener('tasks_studio_config_change', handler);
    return () => window.removeEventListener('tasks_studio_config_change', handler);
  }, []);

  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, params, configVersion],
    queryFn: () => fetchTasks(params),
    staleTime: 1000 * 10,
    retry: (failureCount, error: any) => {
      // No reintentar en 401 ni 422
      if (error?.status === 401 || error?.status === 422) return false;
      return failureCount < 2;
    },
  });
}

export function useTask(id: number | null) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => (id !== null ? fetchTaskById(id) : Promise.reject('No ID')),
    enabled: id !== null,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) => updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      const previousQueries = queryClient.getQueriesData<TasksResponse>({
        queryKey: TASKS_QUERY_KEY,
      });

      // Optimistic update across task caches
      queryClient.setQueriesData<TasksResponse>({ queryKey: TASKS_QUERY_KEY }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...input,
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        };
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      const previousQueries = queryClient.getQueriesData<TasksResponse>({
        queryKey: TASKS_QUERY_KEY,
      });

      // Optimistic removal
      queryClient.setQueriesData<TasksResponse>({ queryKey: TASKS_QUERY_KEY }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((task) => task.id !== id),
          meta: {
            ...old.meta,
            total: Math.max(0, old.meta.total - 1),
          },
        };
      });

      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('no_token');
  const [message, setMessage] = useState<string>('Comprobando...');
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const result = await checkConnection();
      setStatus(result.status);
      setMessage(result.message);
      setStatusCode(result.statusCode);
    } catch {
      setStatus('unreachable');
      setMessage('Error de red');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
    const handler = () => check();
    window.addEventListener('tasks_studio_config_change', handler);
    return () => window.removeEventListener('tasks_studio_config_change', handler);
  }, []);

  return { status, message, statusCode, checking, refetch: check };
}

export function useStoredApiConfig() {
  const [config, setConfig] = useState(getStoredConfig);

  useEffect(() => {
    const handler = () => setConfig(getStoredConfig());
    window.addEventListener('tasks_studio_config_change', handler);
    return () => window.removeEventListener('tasks_studio_config_change', handler);
  }, []);

  return config;
}
