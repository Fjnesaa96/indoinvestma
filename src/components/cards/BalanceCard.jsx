import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function BalanceCard({ balance = 1000, vipLevel = 0, onDeposit, onWithdraw }) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="space-y-3">
      {/* Kartu Saldo Utama */}
      <div className="bg-[#132238] border border-white/10 rounded-2xl p-4 shadow-inner">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Total Nilai Portofolio</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            type="button"
          >
            {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>

        <div className="text-2xl font-black tracking-tight text-white mt-1">
          {showBalance ? `Rp ${Number(balance).toLocaleString('id-ID')}` : '••••••••'}
        </div>

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
          <span>Level Akun: <strong className="text-[#E5A93C]">VIP {vipLevel}</strong></span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
            <ShieldCheck size={13} /> Terverifikasi
          </span>
        </div>
      </div>

      {/* Tombol Aksi Cepat Finansial */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDeposit}
          className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">Deposit</p>
            <p className="text-[10px] text-slate-400">Tambah Saldo</p>
          </div>
        </button>

        <button
          onClick={onWithdraw}
          className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#E5A93C] flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800">Penarikan</p>
            <p className="text-[10px] text-slate-400">Tarik Saldo</p>
          </div>
        </button>
      </div>
    </div>
  );
}
