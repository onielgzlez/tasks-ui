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
  Sparkles,
} from 'lucide-react';
import { useCreateTask, useTasks } from './hooks/use-tasks';
import { cn, isOverdue } from './lib/utils';
import { Task, TaskStatus } from './types/task';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { TaskDrawer } from './components/drawer/TaskDrawer';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Navbar, SortOption, ViewMode } from './components/layout/Navbar';
import { ListView } from './components/list/ListView';
import { CreateTaskModal } from './components/modal/CreateTaskModal';
import { ShortcutsModal } from './components/modal/ShortcutsModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { useToast } from './components/common/ToastContext';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>(undefined);
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<TaskStatus>('pendiente');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const { showToast } = useToast();
  const createTask = useCreateTask();

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
  const filteredAndSortedTasks = useMemo(() => {
    let list = allTasks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          String(t.id).includes(q),
      );
    }

    // Sort tasks
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return (a.dueDate || '').localeCompare(b.dueDate || '');
        case 'newest':
          return b.id - a.id;
        case 'id_asc':
          return a.id - b.id;
        case 'title_asc':
          return a.title.localeCompare(b.title);
      }
    });
  }, [allTasks, searchQuery, sortBy]);

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

  const hasActiveFilters = Boolean(statusFilter || assigneeFilter || searchQuery);

  const handleClearFilters = () => {
    setStatusFilter(undefined);
    setAssigneeFilter(undefined);
    setSearchQuery('');
  };

  // Seed realistic demo tasks if empty
  const handleSeedDemoTasks = async () => {
    const today = new Date();
    const inDays = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0] ?? '';
    };

    const demoTasks = [
      {
        title: 'Auditar seguridad y rate-limiting en tasks-api',
        description: 'Verificar los límites de 300 req/min y los encabezados RFC 7807.',
        status: 'en_curso' as TaskStatus,
        assignee: 'Ana',
        dueDate: inDays(1),
      },
      {
        title: 'Diseñar atajos de teclado y experiencia tipo Linear',
        description: 'Soporte completo para J/K, Espacio, Enter y Paleta de Comandos.',
        status: 'hecha' as TaskStatus,
        assignee: 'Carlos',
        dueDate: inDays(3),
      },
      {
        title: 'Implementar pruebas E2E y verificación de tipos estricta',
        description: 'Garantizar cero regresiones en los flujos CRUD optimistas.',
        status: 'pendiente' as TaskStatus,
        assignee: 'Elena',
        dueDate: inDays(5),
      },
    ];

    try {
      for (const t of demoTasks) {
        await createTask.mutateAsync(t);
      }
      showToast({
        type: 'success',
        title: 'Tareas de ejemplo cargadas',
        description: 'Se crearon 3 tareas con diferentes estados para explorar la app',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'No se pudieron crear tareas',
        description: 'Verifica la conexión con tasks-api en Ajustes',
      });
    }
  };

  // Global Keyboard shortcuts: C (new), 1 (kanban), 2 (list), Cmd+K (palette), ? (shortcuts)
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

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
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
        sortBy={sortBy}
        onSortByChange={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onOpenCreateModal={() => {
          setCreateInitialStatus('pendiente');
          setIsCreateOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        totalTasks={stats.total}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter(undefined)}
            className={cn(
              'bg-zinc-900/60 border rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer shadow-sm',
              statusFilter === undefined
                ? 'border-indigo-500/60 bg-zinc-850/90 ring-1 ring-indigo-500/40'
                : 'border-zinc-850 hover:border-zinc-700 hover:bg-zinc-850/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
            )}
            title="Clic para mostrar todas las tareas"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">Total</p>
              <p className="text-lg font-bold font-mono tracking-tight text-zinc-100">
                {stats.total}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'pendiente' ? undefined : 'pendiente')}
            className={cn(
              'bg-zinc-900/60 border rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer shadow-sm',
              statusFilter === 'pendiente'
                ? 'border-zinc-600 bg-zinc-850/90 ring-1 ring-zinc-500/40'
                : 'border-zinc-850 hover:border-zinc-700 hover:bg-zinc-850/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
            )}
            title="Clic para filtrar por Pendientes"
          >
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
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'en_curso' ? undefined : 'en_curso')}
            className={cn(
              'bg-zinc-900/60 border rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer shadow-sm',
              statusFilter === 'en_curso'
                ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/40'
                : 'border-zinc-850 hover:border-amber-500/40 hover:bg-zinc-850/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
            )}
            title="Clic para filtrar por En curso"
          >
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
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'hecha' ? undefined : 'hecha')}
            className={cn(
              'bg-zinc-900/60 border rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer shadow-sm',
              statusFilter === 'hecha'
                ? 'border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/40'
                : 'border-zinc-850 hover:border-emerald-500/40 hover:bg-zinc-850/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
            )}
            title="Clic para filtrar por Hechas"
          >
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
          </button>
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
              className="font-semibold underline hover:text-rose-100 cursor-pointer active:scale-95 transition-all"
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 hover:border-zinc-700 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-600/40 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
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
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Comienza con tu primera tarea
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    tasks-api está listo y conectado. Crea una tarea manualmente con la tecla{' '}
                    <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                      C
                    </kbd>{' '}
                    o carga datos de prueba para explorar la interfaz.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCreateInitialStatus('pendiente');
                      setIsCreateOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-600/40 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Tarea</span>
                  </button>
                  <button
                    onClick={handleSeedDemoTasks}
                    disabled={createTask.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 hover:text-zinc-100 hover:border-zinc-650 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cargar demo</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={filteredAndSortedTasks}
                onSelectTask={setSelectedTask}
                onQuickCreateInStatus={handleQuickCreateInStatus}
              />
            ) : (
              <ListView tasks={filteredAndSortedTasks} onSelectTask={setSelectedTask} />
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

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

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
