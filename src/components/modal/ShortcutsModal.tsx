import React, { useEffect } from 'react';
import { Command, Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
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

  const shortcutGroups = [
    {
      title: 'Acciones de Tareas',
      items: [
        { key: 'C', description: 'Crear nueva tarea' },
        { key: 'Espacio', description: 'Avanzar estado de tarea seleccionada' },
        { key: 'Enter', description: 'Abrir panel de detalles y edición' },
        { key: 'Esc', description: 'Cerrar panel lateral o modal abierto' },
      ],
    },
    {
      title: 'Vistas y Navegación',
      items: [
        { key: '1', description: 'Cambiar a vista Tablero Kanban' },
        { key: '2', description: 'Cambiar a vista Lista Rápida' },
        { key: 'J / ↓', description: 'Mover selección hacia abajo en la lista' },
        { key: 'K / ↑', description: 'Mover selección hacia arriba en la lista' },
      ],
    },
    {
      title: 'Comandos y Búsqueda',
      items: [
        { key: '⌘K / Ctrl+K', description: 'Abrir Paleta de Comandos global' },
        { key: '/', description: 'Buscar rápidamente' },
        { key: '?', description: 'Abrir esta guía de atajos de teclado' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Atajos de Teclado</h3>
              <p className="text-[11px] text-zinc-500 font-mono">Diseñado para flujo sin mouse</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Groups */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Command className="w-3 h-3 text-indigo-400" />
                <span>{group.title}</span>
              </h4>
              <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl divide-y divide-zinc-850/60 overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-zinc-300 font-medium">{item.description}</span>
                    <kbd className="font-mono text-[11px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-750 shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Presiona{' '}
            <kbd className="font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Esc
            </kbd>{' '}
            para salir
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-200 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
