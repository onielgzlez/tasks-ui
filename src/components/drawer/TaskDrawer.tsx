import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Check, Clock, Trash2, User, X } from 'lucide-react';
import { useDeleteTask, useUpdateTask } from '../../hooks/use-tasks';
import { cn, formatDisplayDate, isOverdue, STATUS_CONFIG } from '../../lib/utils';
import { ApiError, Task, TaskStatus, UpdateTaskInput } from '../../types/task';
import { useToast } from '../common/ToastContext';

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
  knownAssignees: string[];
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ task, onClose, knownAssignees }) => {
  const [formData, setFormData] = useState<UpdateTaskInput>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        assignee: task.assignee,
        dueDate: task.dueDate,
      });
      setFieldErrors({});
      setIsConfirmingDelete(false);
    }
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && task) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  const overdue = isOverdue(formData.dueDate || task.dueDate, formData.status || task.status);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      await updateTask.mutateAsync({
        id: task.id,
        input: formData,
      });

      showToast({
        type: 'success',
        title: 'Tarea actualizada',
        description: `Se guardaron los cambios en #${task.id}`,
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
          title: 'Error al actualizar',
          description: err instanceof Error ? err.message : 'No se pudo guardar la tarea',
        });
      }
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      showToast({
        type: 'info',
        title: 'Tarea eliminada',
        description: `Se eliminó #${task.id}`,
      });
      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error al eliminar',
        description: err instanceof Error ? err.message : 'No se pudo eliminar la tarea',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-zinc-400">#{task.id}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-500 font-mono">
                Actualizado:{' '}
                {new Date(task.updatedAt).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Título
              </label>
              <input
                type="text"
                required
                value={formData.title ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className={cn(
                  'w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all',
                  fieldErrors.title ? 'border-rose-500' : 'border-zinc-800 focus:border-indigo-500',
                )}
                placeholder="Nombre descriptivo de la tarea"
              />
              {fieldErrors.title && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Estado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pendiente', 'en_curso', 'hecha'] as TaskStatus[]).map((st) => {
                  const isSelected = (formData.status ?? task.status) === st;
                  const config = STATUS_CONFIG[st];
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, status: st }))}
                      className={cn(
                        'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all',
                        isSelected
                          ? `${config.bgBadge} ${config.textBadge} ${config.borderBadge} ring-1 ring-inset ring-current`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850',
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two column: Assignee & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Responsable
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="known-assignees-drawer"
                    value={formData.assignee ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
                    className={cn(
                      'w-full bg-zinc-900 border rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all',
                      fieldErrors.assignee
                        ? 'border-rose-500'
                        : 'border-zinc-800 focus:border-indigo-500',
                    )}
                    placeholder="Ej: Ana, Carlos..."
                  />
                  <div className="absolute left-2.5 top-2.5">
                    <User className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
                <datalist id="known-assignees-drawer">
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

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Fecha Vencimiento
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formData.dueDate ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
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
                {overdue && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>Fecha límite vencida ({formatDisplayDate(formData.dueDate || '')})</span>
                  </div>
                )}
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
                rows={5}
                value={formData.description ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className={cn(
                  'w-full bg-zinc-900 border rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-y',
                  fieldErrors.description
                    ? 'border-rose-500'
                    : 'border-zinc-800 focus:border-indigo-500',
                )}
                placeholder="Detalles, criterios de aceptación, enlaces o notas..."
              />
              <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
                <span>{formData.description?.length ?? 0} / 5000 caracteres</span>
              </div>
              {fieldErrors.description && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.description}
                </p>
              )}
            </div>

            {/* Metadata info */}
            <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3.5 space-y-2 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Creada</span>
                <span className="font-mono text-zinc-300">
                  {new Date(task.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Última modificación</span>
                <span className="font-mono text-zinc-300">
                  {new Date(task.updatedAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteTask.isPending}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-colors"
                  >
                    Confirmar Borrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar tarea</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={updateTask.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
