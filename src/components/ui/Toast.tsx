import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string, actionText?: string, onAction?: () => void) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3500);

      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => showToast({ type: 'success', title, description }),
    [showToast]
  );

  const error = useCallback(
    (title: string, description?: string, actionText?: string, onAction?: () => void) =>
      showToast({ type: 'error', title, description, actionText, onAction, duration: 6000 }),
    [showToast]
  );

  const info = useCallback(
    (title: string, description?: string) => showToast({ type: 'info', title, description }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => showToast({ type: 'warning', title, description }),
    [showToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-800 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-stone-700 shrink-0" />;
    }
  };

  const getSeal = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '成';
      case 'error':
        return '阻';
      case 'warning':
        return '省';
      default:
        return '讯';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Toasts Container - Safely positioned below Dynamic Island */}
      <div className="fixed top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] left-3 right-3 sm:left-auto sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-auto sm:w-full pointer-events-none mx-auto sm:mx-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.94 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-[#faf8f5]/95 backdrop-blur-md border border-stone-300 shadow-md p-3 sm:p-3.5 flex items-start gap-2.5 rounded-none font-serif text-stone-900 relative"
            >
              {/* Corner mark */}
              <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-stone-400" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-stone-400" />

              <div className="mt-0.5">{getIcon(toast.type)}</div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm tracking-wider text-stone-900 truncate">
                    {toast.title}
                  </span>
                  <span className="stamp-seal text-[8px] sm:text-[9px] px-1 py-0 select-none">
                    {getSeal(toast.type)}
                  </span>
                </div>

                {toast.description && (
                  <p className="text-[11px] sm:text-xs text-stone-600 tracking-wide mt-0.5 break-words font-sans">
                    {toast.description}
                  </p>
                )}

                {toast.actionText && toast.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                      removeToast(toast.id);
                    }}
                    className="mt-2 text-[11px] font-serif underline text-stone-900 hover:text-stone-700 cursor-pointer block text-left"
                  >
                    {toast.actionText} →
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-stone-800 p-0.5 transition-colors absolute top-2.5 right-2.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
