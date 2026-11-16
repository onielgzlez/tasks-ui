import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Clock, GripVertical } from 'lucide-react';
import { useUpdateTask } from '../../hooks/use-tasks';
import { playSuccessChime, playTick } from '../../lib/sound';
import { cn, formatDisplayDate, getNextStatus, isOverdue, STATUS_CONFIG } from '../../lib/utils';
import { Task } from '../../types/task';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

interface KanbanCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const updateTask = useUpdateTask();
  const overdue = isOverdue(task.dueDate, task.status);
  const statusInfo = STATUS_CONFIG[task.status];

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = getNextStatus(task.status);
    if (nextStatus === 'hecha') {
      playSuccessChime();
    } else {
      playTick();
    }
    updateTask.mutate({
      id: task.id,
      input: { status: nextStatus },
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    playTick();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(task)}
      className={cn(
        'group relative bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 shadow-sm hover:shadow-md hover:shadow-black/40 transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col gap-3',
        isDragging && 'opacity-40 scale-95 border-indigo-500/50',
      )}
    >
      {/* Top Header: Drag handle, ID & Quick Status Advance */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <GripVertical className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="font-mono text-xs font-semibold group-hover:text-zinc-400">
            #{task.id}
          </span>
        </div>

        <button
          onClick={handleStatusCycle}
          title={`Estado actual: ${statusInfo.label}. Clic para avanzar`}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-150',
            statusInfo.bgBadge,
            statusInfo.textBadge,
            statusInfo.borderBadge,
            'hover:scale-105 active:scale-95',
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dotColor)} />
          <span>{statusInfo.label}</span>
          <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </button>
      </div>

      {/* Task Title */}
      <div>
        <h4
          className={cn(
            'text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-indigo-200 transition-colors line-clamp-2',
            task.status === 'hecha' && 'line-through text-zinc-400',
          )}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Info: Assignee & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 mt-auto text-xs">
        <Avatar name={task.assignee} showName size="sm" />

        <div className="flex items-center gap-1.5">
          {overdue ? (
            <Badge variant="danger" size="sm" className="gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDisplayDate(task.dueDate)}</span>
            </Badge>
          ) : (
            <div
              className={cn(
                'flex items-center gap-1 font-mono text-[11px]',
                task.status === 'hecha' ? 'text-zinc-500' : 'text-zinc-400',
              )}
            >
              {task.status === 'hecha' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>{formatDisplayDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
