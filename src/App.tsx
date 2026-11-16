import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useTasks } from './hooks/use-tasks';
import { isOverdue } from './lib/utils';
import { Task, TaskStatus } from './types/task';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { TaskDrawer } from './components/drawer/TaskDrawer';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Navbar, ViewMode } from './components/layout/Navbar';
import { ListView } from './components/list/ListView';
import { CreateTaskModal } from './components/modal/CreateTaskModal';
import { SettingsModal } from './components/settings/SettingsModal';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('pendiente');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Fetch tasks with filters
  const {
    data: tasksResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useTasks({
    status: statusFilter,
    assignee: assigneeFilter,
    limit: 100,
  });

  const allTasks = useMemo(() => tasksResponse?.data ?? [], [tasksResponse]);

  // Extract known assignees from current tasks for auto-complete & filters
  const knownAssignees = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach((t) => {
      if (t.assignee) set.add(t.assignee);
    });
    return Array.from(set).sort();
  }, [allTasks]);

  // Client-side search filtering (by title or description or ID)
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allTasks;
    const q = searchQuery.toLowerCase().trim();
    return allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        String(t.id).includes(q),
    );
  }, [allTasks, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    let pendientes = 0;
    let enCurso = 0;
    let hechas = 0;
    let overdueCount = 0;

    allTasks.forEach((t) => {
      if (t.status === 'pendiente') pendientes++;
      if (t.status === 'en_curso') enCurso++;
      if (t.status === 'hecha') hechas++;
      if (isOverdue(t.dueDate, t.status)) overdueCount++;
    });

    return {
      total: allTasks.length,
      pendientes,
      enCurso,
      hechas,
      overdueCount,
    };
  }, [allTasks]);

  // Global Keyboard shortcuts: C (new), 1 (kanban), 2 (list), Cmd+K (palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCreateInitialStatus('pendiente');
        setIsCreateOpen(true);
        return;
      }

      if (e.key === '1') {
        setViewMode('kanban');
      } else if (e.key === '2') {
        setViewMode('list');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickCreateInStatus = (st: TaskStatus) => {
    setCreateInitialStatus(st);
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        assignees={knownAssignees}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onOpenCreateModal={() => {
          setCreateInitialStatus('pendiente');
          setIsCreateOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        totalTasks={stats.total}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold font-mono tracking-tight text-zinc-100">
                {stats.total}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
                Pendientes
              </p>
              <p className="text-lg font-bold font-mono tracking-tight text-zinc-200">
                {stats.pendientes}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-amber-400/80 font-mono uppercase tracking-wider">
                En curso
              </p>
              <p className="text-lg font-bold font-mono tracking-tight text-amber-400">
                {stats.enCurso}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-400/80 font-mono uppercase tracking-wider">
                Hechas
              </p>
              <p className="text-lg font-bold font-mono tracking-tight text-emerald-400">
                {stats.hechas}
              </p>
            </div>
          </div>
        </div>

        {/* Overdue Warning Alert Banner (if any) */}
        {stats.overdueCount > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Tienes <strong>{stats.overdueCount}</strong>{' '}
                {stats.overdueCount === 1 ? 'tarea vencida' : 'tareas vencidas'} que requieren tu
                atención.
              </span>
            </div>
            <button
              onClick={() => {
                setStatusFilter('pendiente');
              }}
              className="font-semibold underline hover:text-rose-100"
            >
              Ver pendientes
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs font-mono">Cargando tareas desde tasks-api...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="bg-zinc-900/80 border border-rose-500/40 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">No se pudo conectar con tasks-api</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {error instanceof Error ? error.message : 'Error inesperado de comunicación'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar Token</span>
              </button>
            </div>
          </div>
        )}

        {/* Loaded Views */}
        {!isLoading && !isError && (
          <>
            {allTasks.length === 0 ? (
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto my-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Comienza con tu primera tarea
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    tasks-api está listo y conectado. Crea una tarea presionando la tecla{' '}
                    <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                      C
                    </kbd>{' '}
                    o el botón a continuación.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCreateInitialStatus('pendiente');
                    setIsCreateOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Tarea</span>
                </button>
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={filteredTasks}
                onSelectTask={setSelectedTask}
                onQuickCreateInStatus={handleQuickCreateInStatus}
              />
            ) : (
              <ListView tasks={filteredTasks} onSelectTask={setSelectedTask} />
            )}
          </>
        )}
      </main>

      {/* Task Drawer */}
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        knownAssignees={knownAssignees}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultStatus={createInitialStatus}
        knownAssignees={knownAssignees}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={allTasks}
        onSelectTask={setSelectedTask}
        onOpenCreate={() => {
          setCreateInitialStatus('pendiente');
          setIsCreateOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSetViewMode={setViewMode}
        onSetStatusFilter={setStatusFilter}
        onRefetch={refetch}
      />
    </div>
  );
};
