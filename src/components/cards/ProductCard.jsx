import React from 'react';
import { Flame, Clock, TrendingUp } from 'lucide-react';

export default function ProductCard({ item, onInvest }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3 transition-all">
      {/* Header Kartu & Badge Populer */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
        {item.isPopular && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Flame size={12} /> Populer
          </span>
        )}
      </div>

      {/* Rincian Finansial */}
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-50 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">Harga Sewa</span>
          <span className="text-xs font-black text-slate-800">
            Rp {Number(item.price).toLocaleString('id-ID')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Profit Harian</span>
          <span className="text-xs font-black text-emerald-600 flex items-center justify-center gap-0.5">
            <TrendingUp size={11} /> +Rp {Number(item.dailyProfit).toLocaleString('id-ID')}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Masa Kontrak</span>
          <span className="text-xs font-black text-slate-700 flex items-center justify-center gap-0.5">
            <Clock size={11} /> {item.durationDays} Hari
          </span>
        </div>
      </div>

      {/* Baris Progress & Tombol Eksekusi Sewa */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Kuota Terisi</span>
            <span className="font-bold text-slate-600">{item.progress || 75}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-[#E5A93C] rounded-full"
              style={{ width: `${item.progress || 75}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => onInvest(item)}
          className="bg-[#0B1528] text-[#E5A93C] text-xs font-bold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform whitespace-nowrap hover:bg-slate-900"
        >
          Sewa Paket
        </button>
      </div>
    </div>
  );
}
