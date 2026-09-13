import React, { useState } from 'react';
import { PieChart, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';

const DUMMY_PORTFOLIO = [
  {
    id: 'port-1',
    title: 'Paket Likuiditas Pemula',
    investedAmount: 50000,
    dailyProfit: 2500,
    daysRemaining: 18,
    totalDays: 30,
    earnedProfit: 30000,
    status: 'active',
  },
  {
    id: 'port-2',
    title: 'Portofolio Ekuitas Stabil',
    investedAmount: 150000,
    dailyProfit: 8000,
    daysRemaining: 40,
    totalDays: 45,
    earnedProfit: 40000,
    status: 'active',
  },
];

export default function Portfolio() {
  const [items, setItems] = useState(DUMMY_PORTFOLIO);

  const totalInvested = items.reduce((acc, curr) => acc + curr.investedAmount, 0);
  const totalEarned = items.reduce((acc, curr) => acc + curr.earnedProfit, 0);

  const handleClaim = (id) => {
    alert('Profit harian berhasil diklaim ke saldo utama!');
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Ringkasan Modal & Hasil */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Modal Berjalan</span>
          <p className="text-sm font-black text-[#0B1528] mt-0.5">
            Rp {totalInvested.toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Profit Masuk</span>
          <p className="text-sm font-black text-emerald-600 mt-0.5">
            +Rp {totalEarned.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Daftar Kontrak Aktif */}
      <div className="space-y-3">
        {items.map((item) => {
          const progressPercent = Math.round(
            ((item.totalDays - item.daysRemaining) / item.totalDays) * 100
          );

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{item.title}</h3>
                  <span className="text-[10px] text-slate-400">
                    Modal: Rp {item.investedAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={11} /> Berjalan
                </span>
              </div>

              {/* Progress Hari */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Sisa {item.daysRemaining} hari lagi
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E5A93C] rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Rincian Profit & Tombol Klaim */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Profit Dihasilkan</span>
                  <span className="text-xs font-black text-emerald-600">
                    +Rp {item.earnedProfit.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => handleClaim(item.id)}
                  className="bg-[#0B1528] text-[#E5A93C] text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform flex items-center gap-1"
                >
                  <ArrowUpRight size={14} /> Klaim Profit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
