import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function AlertModal({ isOpen, type = 'error', title, message, onClose, onAction, actionLabel }) {
  if (!isOpen) return null;

  const isError = type === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0B1528]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100 text-center space-y-4">
        
        {/* Ikon Notifikasi */}
        <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
          isError 
            ? 'bg-rose-50 text-rose-500 border-rose-100' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
        }`}>
          {isError ? <AlertCircle size={26} /> : <CheckCircle2 size={26} />}
        </div>

        {/* Teks Informasi */}
        <div className="space-y-1.5">
          <h3 className="font-black text-sm text-[#0B1528]">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Tombol Aksi Kustom */}
        <div className="pt-1 flex flex-col gap-2">
          {onAction && (
            <button
              onClick={onAction}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold active:scale-95 transition-transform shadow-md"
            >
              {actionLabel || 'Lanjutkan'}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-transform hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
