import React from 'react';
import { TrendingUp, Clock, Zap, ShieldCheck } from 'lucide-react';

export default function ProductCard({ item, onInvest }) {
  const dailyRate = Math.round((item.dailyProfit / item.price) * 100);
  const hourlyProfit = Math.floor(item.dailyProfit / 24);

  return (
    <div className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-sm relative overflow-hidden transition-transform active:scale-[0.99]">
      {item.isPopular && (
        <div className="absolute top-0 right-0 bg-[#0B1528] text-[#E5A93C] text-[9px] font-extrabold px-3 py-1 rounded-bl-2xl uppercase tracking-wider">
          Paling Laris
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#E5A93C] flex items-center justify-center border border-amber-200">
          <Zap size={16} />
        </div>
        <div>
          <h3 className="font-extrabold text-xs text-[#0B1528]">{item.title}</h3>
          <span className="text-[10px] text-emerald-600 font-bold">
            Rate: {dailyRate}% / 24 Jam
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl mb-3">
        <div>
          <span className="text-[9px] text-slate-400 block">Harga Sewa</span>
          <span className="text-xs font-black text-slate-800">
            Rp {item.price.toLocaleString('id-ID')}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block">Profit Harian</span>
          <span className="text-xs font-black text-emerald-600">
            +Rp {item.dailyProfit.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="col-span-2 pt-1 border-t border-slate-200/50 flex justify-between items-center text-[9px] text-slate-500 font-medium">
          <span>Profit Tiap 1 Jam:</span>
          <span className="font-bold text-[#E5A93C]">+Rp {hourlyProfit.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
          <Clock size={12} className="text-slate-400" />
          <span>Durasi: {item.durationDays} Hari</span>
        </div>

        <button
          onClick={() => onInvest(item)}
          className="py-2 px-4 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold active:scale-95 transition-transform shadow-sm"
        >
          Sewa Paket
        </button>
      </div>
    </div>
  );
}
