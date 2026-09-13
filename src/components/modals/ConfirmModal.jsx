import React from 'react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100 transform transition-all text-center space-y-4">
        
        {/* Ikon Header */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#E5A93C] mx-auto flex items-center justify-center border border-amber-200">
          <ShieldCheck size={26} />
        </div>

        {/* Teks Dialog */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-[#0B1528]">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-transform"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Konfirmasi'}
          </button>
        </div>

      </div>
    </div>
  );
}
