import {
  ApiError,
  CreateTaskInput,
  ProblemDetails,
  Task,
  TaskFilterParams,
  TasksResponse,
  UpdateTaskInput,
} from '../types/task';
import { getStoredConfig } from './api-config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson =
    contentType.includes('application/json') || contentType.includes('application/problem+json');

  if (!response.ok) {
    let problem: ProblemDetails | undefined;
    let message = `Error del servidor (${response.status} ${response.statusText})`;

    if (isJson) {
      try {
        problem = (await response.json()) as ProblemDetails;
        if (problem.title) {
          message = problem.title;
        }
      } catch {
        // Fallback al mensaje por defecto
      }
    } else {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // Fallback
      }
    }

    throw new ApiError(response.status, message, problem);
  }

  return (await response.json()) as T;
}

export function buildHeaders(): HeadersInit {
  const { token } = getStoredConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchTasks(params: TaskFilterParams = {}): Promise<TasksResponse> {
  const { baseUrl } = getStoredConfig();
  const url = new URL(baseUrl, window.location.origin);

  if (params.status) {
    url.searchParams.set('status', params.status);
  }
  if (params.assignee) {
    url.searchParams.set('assignee', params.assignee);
  }
  if (params.page !== undefined) {
    url.searchParams.set('page', String(params.page));
  }
  if (params.limit !== undefined) {
    url.searchParams.set('limit', String(params.limit));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
  });

  return handleResponse<TasksResponse>(response);
}

export async function fetchTaskById(id: number): Promise<Task> {
  const { baseUrl } = getStoredConfig();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBase}/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
  });

  return handleResponse<Task>(response);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { baseUrl } = getStoredConfig();
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

  return handleResponse<Task>(response);
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  const { baseUrl } = getStoredConfig();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBase}/${id}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(input),
  });

  return handleResponse<Task>(response);
}

export async function deleteTask(id: number): Promise<void> {
  const { baseUrl } = getStoredConfig();
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${cleanBase}/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  return handleResponse<void>(response);
}

export type ConnectionStatus = 'connected' | 'unauthorized' | 'unreachable' | 'no_token';

export async function checkConnection(): Promise<{
  status: ConnectionStatus;
  message: string;
  statusCode?: number;
}> {
  const { token, baseUrl } = getStoredConfig();

  if (!token) {
    return {
      status: 'no_token',
      message: 'Token de API no configurado',
    };
  }

  try {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(),
    });

    if (res.ok) {
      return {
        status: 'connected',
        message: 'Conectado a tasks-api',
        statusCode: res.status,
      };
    }

    if (res.status === 401) {
      return {
        status: 'unauthorized',
        message: 'Token inválido o expirado (401)',
        statusCode: 401,
      };
    }

    return {
      status: 'unreachable',
      message: `Error HTTP ${res.status}: ${res.statusText}`,
      statusCode: res.status,
    };
  } catch (err) {
    return {
      status: 'unreachable',
      message: err instanceof Error ? err.message : 'No se pudo contactar con la API',
    };
  }
}
