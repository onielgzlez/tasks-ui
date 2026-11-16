import React from 'react';
import {
  CheckSquare,
  Columns3,
  Filter,
  List as ListIcon,
  Plus,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  User,
} from 'lucide-react';
import { useConnectionStatus } from '../../hooks/use-tasks';
import { cn } from '../../lib/utils';
import { TaskStatus } from '../../types/task';

export type ViewMode = 'kanban' | 'list';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  statusFilter?: TaskStatus;
  onStatusFilterChange: (status?: TaskStatus) => void;
  assigneeFilter?: string;
  onAssigneeFilterChange: (assignee?: string) => void;
  assignees: string[];
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  totalTasks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  assignees,
  searchQuery,
  onSearchQueryChange,
  onOpenCreateModal,
  onOpenSettings,
  onOpenCommandPalette,
  totalTasks,
}) => {
  const { status: connStatus, checking, refetch } = useConnectionStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl transition-all">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-zinc-100">Tasks Studio</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  API
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono -mt-0.5">
                {totalTasks} {totalTasks === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* Connection Status Badge */}
          <button
            onClick={onOpenSettings}
            title="Haz clic para inspeccionar o cambiar credenciales de tasks-api"
            className={cn(
              'group hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all',
              connStatus === 'connected' &&
                'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50',
              connStatus === 'unauthorized' &&
                'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-950/50',
              connStatus === 'unreachable' &&
                'bg-amber-950/30 border-amber-500/30 text-amber-400 hover:bg-amber-950/50',
              connStatus === 'no_token' &&
                'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800',
            )}
          >
            <span className="relative flex h-2 w-2">
              {connStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  connStatus === 'connected' && 'bg-emerald-500',
                  connStatus === 'unauthorized' && 'bg-rose-500',
                  connStatus === 'unreachable' && 'bg-amber-500',
                  connStatus === 'no_token' && 'bg-zinc-500',
                )}
              />
            </span>
            <span className="truncate max-w-[130px]">
              {connStatus === 'connected' && 'tasks-api online'}
              {connStatus === 'unauthorized' && 'Auth 401'}
              {connStatus === 'unreachable' && 'API offline (:3000)'}
              {connStatus === 'no_token' && 'Sin token'}
            </span>
            <RefreshCw
              className={cn(
                'w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-transform',
                checking && 'animate-spin',
              )}
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
            />
          </button>
        </div>

        {/* Search & Command trigger */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs text-zinc-400 transition-all shadow-inner group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              <span>Buscar o ejecutar comando...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">⌘K</kbd>
            </div>
          </button>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'kanban'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm shadow-black/50'
                  : 'text-zinc-400 hover:text-zinc-200',
              )}
              title="Vista Tablero Kanban (1)"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tablero</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm shadow-black/50'
                  : 'text-zinc-400 hover:text-zinc-200',
              )}
              title="Vista Lista Rápida (2)"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lista</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium tracking-tight shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-semibold">Nueva</span>
            <kbd className="hidden lg:inline text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-700/60 border border-indigo-400/30">
              C
            </kbd>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            title="Configuración de tasks-api"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar with Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/40 text-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Estado:
          </span>
          {(
            [
              { key: undefined, label: 'Todos' },
              { key: 'pendiente', label: 'Pendiente' },
              { key: 'en_curso', label: 'En curso' },
              { key: 'hecha', label: 'Hecha' },
            ] as const
          ).map((item) => {
            const isSelected = statusFilter === item.key;
            return (
              <button
                key={item.label}
                onClick={() => onStatusFilterChange(item.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap',
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Assignee Filter & Mobile search */}
        <div className="flex items-center gap-2">
          {/* Mobile search bar */}
          <div className="sm:hidden relative w-36">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Assignee Dropdown */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1">
            <User className="w-3 h-3 text-zinc-500" />
            <select
              value={assigneeFilter || ''}
              onChange={(e) => onAssigneeFilterChange(e.target.value || undefined)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="" className="bg-zinc-900 text-zinc-300">
                Todos los responsables
              </option>
              {assignees.map((name) => (
                <option key={name} value={name} className="bg-zinc-900 text-zinc-300">
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
