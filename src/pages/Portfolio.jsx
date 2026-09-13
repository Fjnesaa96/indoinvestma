import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Clock, Loader2, AlertCircle, PieChart, ShieldCheck, Timer } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AlertModal from '../components/modals/AlertModal';

export default function Portfolio() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      console.error('Gagal memuat portofolio:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Ringkasan Portofolio
  const totalModalAktif = investments.reduce((acc, cur) => acc + Number(cur.invested_amount || 0), 0);
  const totalProfitTerkumpul = investments.reduce((acc, cur) => acc + Number(cur.earned_profit || 0), 0);
  const totalNilaiPortofolio = totalModalAktif + totalProfitTerkumpul;

  // Hitung akumulasi jam klaim profit (35% per 24 jam => 35 / 24 % per jam)
  const calculateClaimable = (item) => {
    const invested = Number(item.invested_amount || 0);
    const hourlyRate = 0.35 / 24; // ~1.4583% per jam
    const hourlyProfit = Math.floor(invested * hourlyRate);

    const lastClaim = item.last_claimed_at ? new Date(item.last_claimed_at).getTime() : new Date(item.created_at).getTime();
    const diffMs = currentTime - lastClaim;
    const hoursElapsed = Math.floor(diffMs / (1000 * 60 * 60));

    const claimableHours = Math.max(0, hoursElapsed);
    const claimableAmount = claimableHours * hourlyProfit;

    const msUntilNextHour = Math.max(0, 3600000 - (diffMs % 3600000));
    const minutesLeft = Math.ceil(msUntilNextHour / 60000);

    return {
      hourlyProfit,
      claimableHours,
      claimableAmount,
      minutesLeft,
      canClaim: claimableHours >= 1,
    };
  };

  const handleClaimProfit = async (item) => {
    if (processingId) return;

    const { claimableHours, claimableAmount, minutesLeft } = calculateClaimable(item);

    if (claimableHours < 1) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Belum Waktunya Klaim',
        message: `Profit dihitung per 1 jam penuh. Siklus jam berikutnya siap dalam ±${minutesLeft} menit lagi.`,
      });
      return;
    }

    try {
      setProcessingId(item.id);

      // 1. Ambil data profil aktif
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, balance')
        .limit(1)
        .single();

      if (profileErr) throw profileErr;

      const currentBalance = Number(profileData.balance || 0);
      const newBalance = currentBalance + claimableAmount;

      // 2. Tambah saldo ke profiles
      const { error: updateBalanceErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profileData.id);

      if (updateBalanceErr) throw updateBalanceErr;

      // 3. Catat transaksi ke riwayat
      await supabase.from('transactions').insert([
        {
          type: 'profit',
          amount: claimableAmount,
          description: `Profit ${claimableHours} Jam (${item.title})`,
          status: 'success',
        },
      ]);

      // 4. Update total profit dan timestamp klaim terakhir
      const updatedEarned = Number(item.earned_profit || 0) + claimableAmount;
      const nowIso = new Date().toISOString();

      const { error: updateInvErr } = await supabase
        .from('user_investments')
        .update({ 
          earned_profit: updatedEarned,
          last_claimed_at: nowIso
        })
        .eq('id', item.id);

      if (updateInvErr) throw updateInvErr;

      // 5. Update state lokal
      setInvestments((prev) =>
        prev.map((inv) =>
          inv.id === item.id 
            ? { ...inv, earned_profit: updatedEarned, last_claimed_at: nowIso } 
            : inv
        )
      );

      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Profit Berhasil Diklaim!',
        message: `Klaim untuk ${claimableHours} jam sebesar Rp ${claimableAmount.toLocaleString('id-ID')} berhasil dicairkan ke saldo utama.`,
      });
    } catch (err) {
      console.error('Gagal klaim profit:', err.message);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Klaim Gagal',
        message: err.message || 'Terjadi gangguan jaringan saat klaim profit.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig((prev) => ({ ...prev, isOpen: false }));
          if (alertConfig.type === 'success') {
            window.location.reload();
          }
        }}
      />

      {/* Ringkasan Portofolio */}
      <div className="bg-[#0B1528] text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5A93C]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Total Nilai Portofolio
            </span>
            <h2 className="text-2xl font-black text-[#E5A93C] tracking-tight mt-0.5">
              Rp {totalNilaiPortofolio.toLocaleString('id-ID')}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E5A93C]">
            <PieChart size={20} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <div>
            <span className="text-[9px] text-slate-400 block font-medium">Modal Aktif</span>
            <span className="text-xs font-bold text-slate-200">
              Rp {totalModalAktif.toLocaleString('id-ID')}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-medium">Rate Harian</span>
            <span className="text-xs font-bold text-emerald-400">
              35% / 24 Jam (~1.46%/jam)
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-[#E5A93C]" size={22} />
          <span className="text-xs">Memuat daftar kontrak...</span>
        </div>
      )}

      {!loading && investments.length === 0 && (
        <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-100 space-y-2">
          <AlertCircle className="mx-auto text-slate-300" size={32} />
          <p className="text-xs font-bold text-slate-700">Belum Ada Investasi Aktif</p>
          <p className="text-[10px] text-slate-400">
            Pilih paket likuiditas di menu Market untuk mulai menghasilkan profit per jam.
          </p>
        </div>
      )}

      {!loading && investments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kontrak Berjalan ({investments.length})
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck size={12} /> Profit Per Jam Aktif
            </span>
          </div>

          {investments.map((item) => {
            const { hourlyProfit, claimableHours, claimableAmount, minutesLeft, canClaim } = calculateClaimable(item);
            const dailyEstimated = Math.floor(Number(item.invested_amount || 0) * 0.35);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0B1528]">{item.title}</h4>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold uppercase">
                      {item.status || 'Aktif'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Modal Sewa</span>
                    <span className="text-xs font-black text-slate-800">
                      Rp {Number(item.invested_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl text-center">
                  <div>
                    <span className="text-[8px] text-slate-400 block">Per Jam</span>
                    <span className="text-[10px] font-bold text-slate-700">
                      +Rp {hourlyProfit.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">Per 24 Jam (35%)</span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      +Rp {dailyEstimated.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">Total Dicairkan</span>
                    <span className="text-[10px] font-bold text-[#E5A93C]">
                      Rp {Number(item.earned_profit || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Timer size={13} className="text-[#E5A93C]" />
                    {canClaim ? (
                      <span className="font-bold text-emerald-600">
                        Tersedia: {claimableHours} Jam (+Rp {claimableAmount.toLocaleString('id-ID')})
                      </span>
                    ) : (
                      <span>Rilis dalam: ±{minutesLeft} mnt</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleClaimProfit(item)}
                    disabled={processingId === item.id}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform shadow-sm ${
                      canClaim
                        ? 'bg-[#0B1528] text-[#E5A93C]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {processingId === item.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <TrendingUp size={13} />
                    )}
                    {canClaim ? `Klaim (${claimableHours}j)` : 'Menunggu Siklus'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
