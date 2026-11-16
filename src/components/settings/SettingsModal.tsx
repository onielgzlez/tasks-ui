import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Link,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  X,
} from 'lucide-react';
import { checkConnection, ConnectionStatus } from '../../services/api-client';
import { getStoredConfig, resetStoredConfig, saveStoredConfig } from '../../services/api-config';
import { cn } from '../../lib/utils';
import { useToast } from '../common/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: ConnectionStatus;
    message: string;
    latencyMs?: number;
    statusCode?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredConfig();
      setBaseUrl(cfg.baseUrl);
      setToken(cfg.token);
      setTestResult(null);
    }
  }, [isOpen]);

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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const start = performance.now();

    // Temporarily save to test with entered values
    saveStoredConfig({ baseUrl, token });

    try {
      const res = await checkConnection();
      const latency = Math.round(performance.now() - start);
      setTestResult({
        ...res,
        latencyMs: latency,
      });
    } catch (err) {
      setTestResult({
        status: 'unreachable',
        message: err instanceof Error ? err.message : 'Error al conectar',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredConfig({ baseUrl, token });
    showToast({
      type: 'success',
      title: 'Configuración guardada',
      description: 'Se actualizaron los parámetros de conexión con tasks-api',
    });
    onClose();
  };

  const handleReset = () => {
    if (confirm('¿Restablecer configuración a los valores por defecto del entorno?')) {
      resetStoredConfig();
      const def = getStoredConfig();
      setBaseUrl(def.baseUrl);
      setToken(def.token);
      setTestResult(null);
      showToast({
        type: 'info',
        title: 'Valores restablecidos',
        description: 'Se cargaron los valores de .env.local / Vite proxy',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Server className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                Conexión con tasks-api
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Express 5 • SQLite • Bearer Token
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-zinc-500" />
              <span>URL Base de la API</span>
            </label>
            <input
              type="text"
              required
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
              placeholder="/api/tasks o http://127.0.0.1:3000/api/tasks"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              En desarrollo local se usa el proxy de Vite en{' '}
              <code className="text-zinc-400">/api/tasks</code> hacia el puerto 3000.
            </p>
          </div>

          {/* API Bearer Token */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-500" />
              <span>API Bearer Token (64 caracteres hex)</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-3.5 pr-10 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                placeholder="Pegar token de tasks-api/.env"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-2 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer active:scale-90"
                title={showToken ? 'Ocultar token' : 'Mostrar token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                El token se encuentra en el archivo{' '}
                <strong className="text-zinc-300 font-mono">tasks-api/.env</strong> (variable{' '}
                <strong className="text-zinc-300 font-mono">API_TOKEN</strong>).
              </span>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Diagnóstico de Conexión</span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-600 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3 h-3', testing && 'animate-spin')} />
                <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-lg border text-xs',
                  testResult.status === 'connected' &&
                    'bg-emerald-950/20 border-emerald-500/30 text-emerald-300',
                  testResult.status === 'unauthorized' &&
                    'bg-rose-950/20 border-rose-500/30 text-rose-300',
                  testResult.status === 'unreachable' &&
                    'bg-amber-950/20 border-amber-500/30 text-amber-300',
                  testResult.status === 'no_token' && 'bg-zinc-900 border-zinc-700 text-zinc-300',
                )}
              >
                {testResult.status === 'connected' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {testResult.status === 'unauthorized' && (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                {(testResult.status === 'unreachable' || testResult.status === 'no_token') && (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.latencyMs !== undefined && (
                    <p className="text-[10px] opacity-75 mt-0.5 font-mono">
                      Latencia: {testResult.latencyMs} ms{' '}
                      {testResult.statusCode && `(Código HTTP ${testResult.statusCode})`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 border border-transparent hover:border-zinc-800 transition-all cursor-pointer active:scale-95"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Ajustes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
