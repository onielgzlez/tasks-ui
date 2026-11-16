import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Calendar, Plus, User, X } from 'lucide-react';
import { useCreateTask } from '../../hooks/use-tasks';
import { cn, STATUS_CONFIG } from '../../lib/utils';
import { ApiError, CreateTaskInput, TaskStatus } from '../../types/task';
import { useToast } from '../common/ToastContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
  knownAssignees: string[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultStatus = 'pendiente',
  knownAssignees,
}) => {
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0] ?? '';
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setAssignee(knownAssignees[0] ?? '');
      setDueDate(getDefaultDueDate());
      setFieldErrors({});

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultStatus, knownAssignees]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      assignee: assignee.trim(),
      dueDate,
    };

    try {
      const created = await createTask.mutateAsync(input);
      showToast({
        type: 'success',
        title: 'Tarea creada',
        description: `#${created.id}: ${created.title}`,
      });
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.problem?.errors) {
        const errorsMap: Record<string, string> = {};
        err.problem.errors.forEach((er) => {
          errorsMap[er.field] = er.message;
        });
        setFieldErrors(errorsMap);
      } else {
        showToast({
          type: 'error',
          title: 'Error al crear tarea',
          description: err instanceof Error ? err.message : 'Verifica los datos e intenta de nuevo',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Nueva Tarea</h3>
              <p className="text-[11px] text-zinc-500 font-mono">Registrar en tasks-api (SQLite)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Título <span className="text-indigo-400">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all',
                fieldErrors.title ? 'border-rose-500' : 'border-zinc-800 focus:border-indigo-500',
              )}
              placeholder="¿Qué tarea debe realizarse?"
            />
            <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
              {fieldErrors.title ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.title}
                </span>
              ) : (
                <span>1 a 200 caracteres</span>
              )}
              <span>{title.length} / 200</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Estado Inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['pendiente', 'en_curso', 'hecha'] as TaskStatus[]).map((st) => {
                const isSelected = status === st;
                const config = STATUS_CONFIG[st];
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm',
                      isSelected
                        ? `${config.bgBadge} ${config.textBadge} ${config.borderBadge} ring-1 ring-inset ring-current`
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700',
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Responsable <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={100}
                  list="modal-known-assignees"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={cn(
                    'w-full bg-zinc-900 border rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all',
                    fieldErrors.assignee
                      ? 'border-rose-500'
                      : 'border-zinc-800 focus:border-indigo-500',
                  )}
                  placeholder="Ej: Ana, Santiago..."
                />
                <div className="absolute left-2.5 top-2.5">
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
              <datalist id="modal-known-assignees">
                {knownAssignees.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              {fieldErrors.assignee && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.assignee}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Vencimiento <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={cn(
                    'w-full bg-zinc-900 border rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono',
                    fieldErrors.dueDate
                      ? 'border-rose-500'
                      : 'border-zinc-800 focus:border-indigo-500',
                  )}
                />
                <div className="absolute left-2.5 top-2.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
              {fieldErrors.dueDate && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                'w-full bg-zinc-900 border rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none',
                fieldErrors.description
                  ? 'border-rose-500'
                  : 'border-zinc-800 focus:border-indigo-500',
              )}
              placeholder="Detalles opcionales sobre la tarea..."
            />
            {fieldErrors.description && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 border border-transparent hover:border-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
