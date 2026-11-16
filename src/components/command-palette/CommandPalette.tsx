import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Columns3,
  List as ListIcon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { cn, STATUS_CONFIG } from '../../lib/utils';
import { Task, TaskStatus } from '../../types/task';
import { ViewMode } from '../layout/Navbar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSetStatusFilter: (status?: TaskStatus) => void;
  onRefetch: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onOpenCreate,
  onOpenSettings,
  onSetViewMode,
  onSetStatusFilter,
  onRefetch,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // List of quick commands
  const defaultCommands = useMemo(
    () => [
      {
        id: 'create',
        title: 'Crear nueva tarea',
        category: 'Acciones',
        icon: Plus,
        action: () => {
          onClose();
          onOpenCreate();
        },
      },
      {
        id: 'view-kanban',
        title: 'Cambiar a vista Tablero Kanban',
        category: 'Vistas',
        icon: Columns3,
        action: () => {
          onClose();
          onSetViewMode('kanban');
        },
      },
      {
        id: 'view-list',
        title: 'Cambiar a vista Lista Rápida',
        category: 'Vistas',
        icon: ListIcon,
        action: () => {
          onClose();
          onSetViewMode('list');
        },
      },
      {
        id: 'filter-all',
        title: 'Mostrar todas las tareas',
        category: 'Filtros',
        icon: CheckSquare,
        action: () => {
          onClose();
          onSetStatusFilter(undefined);
        },
      },
      {
        id: 'filter-pendiente',
        title: 'Filtrar por: Pendiente',
        category: 'Filtros',
        icon: CheckSquare,
        action: () => {
          onClose();
          onSetStatusFilter('pendiente');
        },
      },
      {
        id: 'filter-en-curso',
        title: 'Filtrar por: En curso',
        category: 'Filtros',
        icon: CheckSquare,
        action: () => {
          onClose();
          onSetStatusFilter('en_curso');
        },
      },
      {
        id: 'filter-hecha',
        title: 'Filtrar por: Hecha',
        category: 'Filtros',
        icon: CheckSquare,
        action: () => {
          onClose();
          onSetStatusFilter('hecha');
        },
      },
      {
        id: 'refetch',
        title: 'Sincronizar con tasks-api',
        category: 'Sistema',
        icon: RefreshCw,
        action: () => {
          onClose();
          onRefetch();
        },
      },
      {
        id: 'settings',
        title: 'Configuración y credenciales de API',
        category: 'Sistema',
        icon: Settings,
        action: () => {
          onClose();
          onOpenSettings();
        },
      },
    ],
    [onClose, onOpenCreate, onSetViewMode, onSetStatusFilter, onRefetch, onOpenSettings],
  );

  // Filter tasks based on query
  const matchingTasks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        String(t.id).includes(q),
    );
  }, [tasks, query]);

  const matchingCommands = useMemo(() => {
    if (!query.trim()) return defaultCommands;
    const q = query.toLowerCase();
    return defaultCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
    );
  }, [defaultCommands, query]);

  const allItems = useMemo(() => {
    return [
      ...matchingTasks.map((t) => ({ type: 'task' as const, item: t })),
      ...matchingCommands.map((c) => ({ type: 'command' as const, item: c })),
    ];
  }, [matchingTasks, matchingCommands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          if (selected.type === 'task') {
            onClose();
            onSelectTask(selected.item);
          } else {
            selected.item.action();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose, onSelectTask]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe un comando o busca tareas..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-900">
          {allItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-medium">
              No se encontraron tareas ni comandos coincidentes
            </div>
          ) : (
            <div className="space-y-1">
              {allItems.map((entry, idx) => {
                const isSelected = idx === selectedIndex;

                if (entry.type === 'task') {
                  const t = entry.item;
                  const config = STATUS_CONFIG[t.status];
                  return (
                    <button
                      key={`task-${t.id}`}
                      onClick={() => {
                        onClose();
                        onSelectTask(t);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700/60 shadow-sm'
                          : 'text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="font-mono text-zinc-500 text-[11px]">#{t.id}</span>
                        <span className="font-medium truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-medium">{t.assignee}</span>
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full border',
                            config.bgBadge,
                            config.textBadge,
                            config.borderBadge,
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                    </button>
                  );
                }

                const cmd = entry.item;
                const Icon = cmd.icon;
                return (
                  <button
                    key={`cmd-${cmd.id}`}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700/60 shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{cmd.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                      {cmd.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Usa ↑ ↓ para navegar, Enter para seleccionar</span>
          <span>Tasks Studio</span>
        </div>
      </div>
    </div>
  );
};
