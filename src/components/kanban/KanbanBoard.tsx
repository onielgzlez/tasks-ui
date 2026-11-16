import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUpdateTask } from '../../hooks/use-tasks';
import { playSuccessChime, playTick } from '../../lib/sound';
import { cn, STATUS_CONFIG } from '../../lib/utils';
import { Task, TaskStatus } from '../../types/task';
import { useToast } from '../common/ToastContext';
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
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const updateTask = useUpdateTask();
  const { showToast } = useToast();

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = Number(taskIdStr);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    if (targetStatus === 'hecha') {
      playSuccessChime();
    } else {
      playTick();
    }

    updateTask.mutate(
      {
        id: taskId,
        input: { status: targetStatus },
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Tarea movida',
            description: `#${taskId} movida a ${STATUS_CONFIG[targetStatus].label}`,
          });
        },
      },
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map((columnStatus) => {
        const columnTasks = tasks.filter((t) => t.status === columnStatus);
        const config = STATUS_CONFIG[columnStatus];
        const isTarget = dragOverColumn === columnStatus;

        return (
          <div
            key={columnStatus}
            onDragOver={(e) => handleDragOver(e, columnStatus)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, columnStatus)}
            className={cn(
              'flex flex-col bg-zinc-950/60 rounded-2xl border p-4 min-h-[520px] transition-all duration-200',
              isTarget
                ? 'border-indigo-500/80 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                : 'border-zinc-800/80',
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-sm"
                title={`Crear tarea en ${config.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task List in Column */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
              {columnTasks.length === 0 ? (
                <div
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl my-2 transition-colors',
                    isTarget ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-zinc-850',
                  )}
                >
                  <p className="text-xs text-zinc-400 font-medium">
                    {isTarget ? 'Suelta aquí la tarea' : 'No hay tareas en esta etapa'}
                  </p>
                  {!isTarget && (
                    <button
                      onClick={() => onQuickCreateInStatus(columnStatus)}
                      className="mt-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      + Agregar tarea
                    </button>
                  )}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <KanbanCard key={task.id} task={task} onSelect={onSelectTask} />
                ))
              )}

              {/* Ghost drop indicator when dragging over a populated column */}
              {isTarget && columnTasks.length > 0 && (
                <div className="h-16 border-2 border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/5 flex items-center justify-center text-xs text-indigo-400 font-medium">
                  Soltar aquí para mover a {config.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
