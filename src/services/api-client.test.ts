import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkConnection, createTask, deleteTask, fetchTasks, updateTask } from './api-client';
import { resetStoredConfig, saveStoredConfig } from './api-config';
import { ApiError } from '../types/task';

describe('api-client', () => {
  beforeEach(() => {
    resetStoredConfig();
    saveStoredConfig({
      baseUrl: 'http://127.0.0.1:3000/api/tasks',
      token: 'test-token-123',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStoredConfig();
  });

  it('sends authorization header and parses response on fetchTasks', async () => {
    const mockTasksResponse = {
      data: [
        {
          id: 1,
          title: 'Test',
          description: '',
          status: 'pendiente',
          assignee: 'Ana',
          dueDate: '2026-12-10',
          createdAt: '2026-11-16T12:00:00Z',
          updatedAt: '2026-11-16T12:00:00Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockTasksResponse,
    } as Response);

    const result = await fetchTasks({ status: 'pendiente', assignee: 'Ana' });
    expect(result).toEqual(mockTasksResponse);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('status=pendiente'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
  });

  it('handles RFC 7807 problem details error format', async () => {
    const problemJson = {
      type: 'about:blank',
      title: 'Datos inválidos.',
      status: 422,
      instance: '/api/tasks',
      errors: [{ field: 'title', message: 'El título no puede estar vacío' }],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: new Headers({ 'content-type': 'application/problem+json' }),
      json: async () => problemJson,
    } as Response);

    await expect(
      createTask({
        title: '',
        description: '',
        assignee: 'Ana',
        dueDate: '2026-12-10',
      }),
    ).rejects.toThrowError(ApiError);
  });

  it('sends PATCH request to task URL on updateTask', async () => {
    const updatedTask = {
      id: 5,
      title: 'Updated',
      description: '',
      status: 'hecha',
      assignee: 'Ana',
      dueDate: '2026-12-10',
      createdAt: '2026-11-16T12:00:00Z',
      updatedAt: '2026-11-16T12:05:00Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => updatedTask,
    } as Response);

    const res = await updateTask(5, { status: 'hecha' });
    expect(res).toEqual(updatedTask);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/tasks/5',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'hecha' }),
      }),
    );
  });

  it('sends DELETE request on deleteTask and handles 204 No Content', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as Response);

    await expect(deleteTask(7)).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/tasks/7',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('checkConnection returns connected when API responds ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response);

    const status = await checkConnection();
    expect(status.status).toBe('connected');
  });

  it('checkConnection returns unauthorized on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
    } as Response);

    const status = await checkConnection();
    expect(status.status).toBe('unauthorized');
  });
});
