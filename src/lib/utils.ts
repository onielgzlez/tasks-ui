import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskStatus } from '../types/task';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0] ?? '0', 10);
  const month = parseInt(parts[1] ?? '1', 10) - 1;
  const day = parseInt(parts[2] ?? '1', 10);

  const date = new Date(year, month, day);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function isOverdue(dueDateStr: string, status: TaskStatus): boolean {
  if (status === 'hecha' || !dueDateStr) return false;
  const today = new Date().toISOString().split('T')[0] ?? '';
  return dueDateStr < today;
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'pendiente':
      return 'Pendiente';
    case 'en_curso':
      return 'En curso';
    case 'hecha':
      return 'Hecha';
  }
}

export function getNextStatus(status: TaskStatus): TaskStatus {
  switch (status) {
    case 'pendiente':
      return 'en_curso';
    case 'en_curso':
      return 'hecha';
    case 'hecha':
      return 'pendiente';
  }
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    bgBadge: string;
    textBadge: string;
    borderBadge: string;
    dotColor: string;
    columnBorder: string;
  }
> = {
  pendiente: {
    label: 'Pendiente',
    bgBadge: 'bg-zinc-800/80',
    textBadge: 'text-zinc-300',
    borderBadge: 'border-zinc-700/60',
    dotColor: 'bg-zinc-400',
    columnBorder: 'border-zinc-800',
  },
  en_curso: {
    label: 'En curso',
    bgBadge: 'bg-amber-500/10',
    textBadge: 'text-amber-400',
    borderBadge: 'border-amber-500/30',
    dotColor: 'bg-amber-400',
    columnBorder: 'border-amber-500/30',
  },
  hecha: {
    label: 'Hecha',
    bgBadge: 'bg-emerald-500/10',
    textBadge: 'text-emerald-400',
    borderBadge: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    columnBorder: 'border-emerald-500/30',
  },
};

const AVATAR_PALETTES = [
  { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30' },
  { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
];

export function getAssigneeStyle(name: string) {
  if (!name) return AVATAR_PALETTES[0]!;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index]!;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.slice(0, 2).toUpperCase() ?? '?';
  }
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
