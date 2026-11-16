export type TaskStatus = 'pendiente' | 'en_curso' | 'hecha';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TasksMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TasksResponse {
  data: Task[];
  meta: TasksMeta;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status?: TaskStatus;
  assignee: string;
  dueDate: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string;
  dueDate?: string;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  assignee?: string;
  page?: number;
  limit?: number;
}

export interface ProblemFieldError {
  field: string;
  message: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  instance: string;
  errors?: ProblemFieldError[];
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}
