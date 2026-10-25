import React from 'react';
import { AlertTriangle, Info, XCircle, X } from 'lucide-react';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  severity?: 'warning' | 'info' | 'error';
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  severity = 'warning',
  onClose,
}) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              severity === 'warning'
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                : severity === 'info'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
            }`}
          >
            {severity === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : severity === 'info' ? (
              <Info className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>
          <h3 className="text-lg font-bold flex-1 text-slate-900 dark:text-white m-0">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          <p className="m-0 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="px-5 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
