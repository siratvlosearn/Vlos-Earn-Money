import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-[0_12px_30px_-5px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)] border backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-200 ${
            t.type === 'success'
              ? 'bg-white/95 border-emerald-300 text-slate-800'
              : t.type === 'error'
              ? 'bg-white/95 border-red-300 text-slate-800'
              : 'bg-white/95 border-slate-300 text-slate-800'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />}
          <div className="text-xs font-semibold leading-snug flex-1">{t.message}</div>
        </div>
      ))}
    </div>
  );
};
