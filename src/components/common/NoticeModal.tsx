import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X } from 'lucide-react';

interface NoticeModalProps {
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({ onClose }) => {
  const { activeNotices } = useApp();

  if (activeNotices.length === 0) return null;
  const notice = activeNotices[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.15)] p-6 sm:p-7 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-2xs">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-red-600 font-bold px-2 py-0.5 rounded-md bg-red-50 border border-red-200 shadow-2xs">
              PLATFORM NOTICE
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">{notice.title}</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pt-1">
          {notice.message}
        </p>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl btn-3d-red text-xs font-bold transition-all"
          >
            {notice.buttonText || 'Understood, Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
