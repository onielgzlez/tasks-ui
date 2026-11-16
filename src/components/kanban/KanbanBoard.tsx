import React from 'react';
import { Plus } from 'lucide-react';
import { cn, STATUS_CONFIG } from '../../lib/utils';
import { Task, TaskStatus } from '../../types/task';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickCreateInStatus: (status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = ['pendiente', 'en_curso', 'hecha'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onQuickCreateInStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map((columnStatus) => {
        const columnTasks = tasks.filter((t) => t.status === columnStatus);
        const config = STATUS_CONFIG[columnStatus];

        return (
          <div
            key={columnStatus}
            className={cn(
              'flex flex-col bg-zinc-950/60 rounded-2xl border border-zinc-800/80 p-4 min-h-[500px]',
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/70">
              <div className="flex items-center gap-2.5">
                <span className={cn('w-2 h-2 rounded-full', config.dotColor)} />
                <h3 className="font-semibold text-sm tracking-tight text-zinc-100">
                  {config.label}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onQuickCreateInStatus(columnStatus)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 transition-colors"
                title={`Crear tarea en ${config.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List in Column */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-zinc-850 rounded-xl my-2">
                  <p className="text-xs text-zinc-500 font-medium">No hay tareas en esta etapa</p>
                  <button
                    onClick={() => onQuickCreateInStatus(columnStatus)}
                    className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    + Agregar tarea
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <KanbanCard key={task.id} task={task} onSelect={onSelectTask} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
