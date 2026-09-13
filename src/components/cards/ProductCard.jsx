import React from 'react';
import { TrendingUp, Clock, ShieldCheck } from 'lucide-react';

export default function ProductCard({ item, onInvest }) {
  const {
    title,
    price,
    dailyProfit,
    durationDays,
    progress = 65,
    isPopular = false,
  } = item;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3 relative overflow-hidden transition-all active:scale-[0.99]">
      {isPopular && (
        <div className="absolute top-0 right-0 bg-[#E5A93C] text-[#0B1528] text-[9px] font-black uppercase px-3 py-0.5 rounded-bl-xl tracking-wider">
          Populer
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#0B1528]">
          <TrendingUp size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{title}</h3>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" /> Kontrak Terjamin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[#F8FAFC] rounded-xl mb-3 text-center border border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 block">Harga</span>
          <span className="text-xs font-black text-slate-800">
            Rp {Number(price).toLocaleString('id-ID')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Profit/Hari</span>
          <span className="text-xs font-bold text-emerald-600">
            +Rp {Number(dailyProfit).toLocaleString('id-ID')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Durasi</span>
          <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-0.5">
            <Clock size={11} className="text-slate-400" /> {durationDays} Hari
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Kuota</span>
            <span className="font-semibold text-slate-600">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0B1528] to-[#E5A93C] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onInvest(item)}
          className="bg-[#0B1528] hover:bg-[#132238] active:scale-95 text-[#E5A93C] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          Sewa Paket
        </button>
      </div>
    </div>
  );
}
