import React, { useState, useEffect } from 'react';
import { PieChart, CheckCircle2, Clock, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((inv) => ({
        id: inv.id,
        title: inv.title,
        investedAmount: Number(inv.invested_amount),
        dailyProfit: Number(inv.daily_profit),
        daysRemaining: inv.days_remaining,
        totalDays: inv.total_days,
        earnedProfit: Number(inv.earned_profit),
        status: inv.status,
      }));

      setItems(mapped);
    } catch (err) {
      console.error('Gagal memuat portofolio:', err.message);
      setErrorMsg('Gagal memuat daftar portofolio aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const totalInvested = items.reduce((acc, curr) => acc + curr.investedAmount, 0);
  const totalEarned = items.reduce((acc, curr) => acc + curr.earnedProfit, 0);

  const handleClaim = async (item) => {
    try {
      const addedProfit = item.dailyProfit;
      const newEarned = item.earnedProfit + addedProfit;

      const { error } = await supabase
        .from('user_investments')
        .update({ earned_profit: newEarned })
        .eq('id', item.id);

      if (error) throw error;

      alert(`Sukses klaim profit harian +Rp ${addedProfit.toLocaleString('id-ID')}!`);
      fetchInvestments();
    } catch (err) {
      alert('Gagal klaim profit: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm mt-1">
        <Loader2 className="animate-spin text-[#E5A93C]" size={24} />
        <p className="text-xs font-medium">Memuat portofolio investasi...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-2.5 text-xs mt-1">
        <AlertCircle size={18} />
        <span>{errorMsg}</span>
      </div>
    );
  }

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
        {items.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
            Belum ada paket investasi aktif.
          </div>
        ) : (
          items.map((item) => {
            const progressPercent = Math.min(
              100,
              Math.max(
                0,
                Math.round(((item.totalDays - item.daysRemaining) / item.totalDays) * 100)
              )
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
                    <CheckCircle2 size={11} /> {item.status}
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
                      className="h-full bg-[#E5A93C] rounded-full transition-all duration-300"
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
                    onClick={() => handleClaim(item)}
                    className="bg-[#0B1528] text-[#E5A93C] text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform flex items-center gap-1"
                  >
                    <ArrowUpRight size={14} /> Klaim Profit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
