import React, { useEffect, useState } from 'react';
import { Calendar, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { useDeleteTask, useUpdateTask } from '../../hooks/use-tasks';
import { playSuccessChime, playTick } from '../../lib/sound';
import { cn, formatDisplayDate, getNextStatus, isOverdue, STATUS_CONFIG } from '../../lib/utils';
import { Task } from '../../types/task';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useToast } from '../common/ToastContext';

interface ListViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const ListView: React.FC<ListViewProps> = ({ tasks, onSelectTask }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();

  // Keyboard navigation for power users (J/K or Up/Down, Enter to open, Space to advance status)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (tasks.length === 0) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < tasks.length ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedTask = tasks[selectedIndex];
        if (selectedTask) onSelectTask(selectedTask);
      } else if (e.key === ' ') {
        e.preventDefault();
        const selectedTask = tasks[selectedIndex];
        if (selectedTask) {
          const next = getNextStatus(selectedTask.status);
          if (next === 'hecha') {
            playSuccessChime();
          } else {
            playTick();
          }
          updateTask.mutate({ id: selectedTask.id, input: { status: next } });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tasks, selectedIndex, onSelectTask, updateTask]);

  if (tasks.length === 0) {
    return (
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-12 text-center">
        <p className="text-zinc-400 font-medium">No se encontraron tareas</p>
        <p className="text-xs text-zinc-500 mt-1">Crea una nueva o ajusta tus filtros</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-mono uppercase tracking-wider text-zinc-400 select-none">
        <div className="col-span-2 sm:col-span-2">Estado</div>
        <div className="col-span-1 hidden sm:block">ID</div>
        <div className="col-span-6 sm:col-span-5">Tarea</div>
        <div className="col-span-2 sm:col-span-2">Responsable</div>
        <div className="col-span-2 sm:col-span-2 text-right">Vencimiento</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-zinc-850/80">
        {tasks.map((task, index) => {
          const isSelected = index === selectedIndex;
          const overdue = isOverdue(task.dueDate, task.status);
          const statusConfig = STATUS_CONFIG[task.status];

          return (
            <div
              key={task.id}
              onClick={() => {
                setSelectedIndex(index);
                onSelectTask(task);
              }}
              className={cn(
                'grid grid-cols-12 gap-4 px-5 py-3 items-center text-xs transition-all cursor-pointer group',
                isSelected
                  ? 'bg-zinc-850/80 ring-1 ring-inset ring-indigo-500/50 shadow-sm'
                  : 'hover:bg-zinc-850/60 hover:shadow-inner',
              )}
            >
              {/* Status pill with cycle button */}
              <div className="col-span-2 sm:col-span-2 flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = getNextStatus(task.status);
                    if (next === 'hecha') {
                      playSuccessChime();
                    } else {
                      playTick();
                    }
                    updateTask.mutate({ id: task.id, input: { status: next } });
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer shadow-sm',
                    statusConfig.bgBadge,
                    statusConfig.textBadge,
                    statusConfig.borderBadge,
                    'hover:scale-105 hover:brightness-125 hover:shadow active:scale-95',
                  )}
                  title="Clic para avanzar estado"
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotColor)} />
                  <span className="hidden sm:inline">{statusConfig.label}</span>
                  <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* ID */}
              <div className="col-span-1 hidden sm:block font-mono text-zinc-500 text-[11px]">
                #{task.id}
              </div>

              {/* Title & snippet */}
              <div className="col-span-6 sm:col-span-5 pr-2">
                <p
                  className={cn(
                    'font-medium text-zinc-100 group-hover:text-indigo-200 transition-colors truncate',
                    task.status === 'hecha' && 'line-through text-zinc-400',
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{task.description}</p>
                )}
              </div>

              {/* Assignee */}
              <div className="col-span-2 sm:col-span-2">
                <Avatar name={task.assignee} showName size="sm" />
              </div>

              {/* Due Date & Action */}
              <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-3 text-right">
                {overdue ? (
                  <Badge variant="danger" size="sm" className="gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDisplayDate(task.dueDate)}</span>
                  </Badge>
                ) : (
                  <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500 hidden sm:inline" />
                    {formatDisplayDate(task.dueDate)}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar la tarea #${task.id} "${task.title}"?`)) {
                      deleteTask.mutate(task.id, {
                        onSuccess: () => {
                          showToast({
                            type: 'info',
                            title: 'Tarea eliminada',
                            description: `Se eliminó #${task.id}`,
                          });
                        },
                      });
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-500/20 active:scale-90 transition-all cursor-pointer shadow-sm"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="px-5 py-2.5 bg-zinc-900/40 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">J</kbd> /{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">K</kbd>{' '}
            navegar
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">
              Espacio
            </kbd>{' '}
            avanzar estado
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/60">Enter</kbd>{' '}
            abrir detalle
          </span>
        </div>
        <span>{tasks.length} tareas</span>
      </div>
    </div>
  );
};
