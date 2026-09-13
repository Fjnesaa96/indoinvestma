import React, { useState } from 'react';
import { Users, Copy, Check, Award, ArrowUpRight, Shield } from 'lucide-react';

export default function Jaringan() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'INDO779';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: 'Total Anggota', value: '18 Orang', note: 'Aktif berinvestasi' },
    { label: 'Komisi Diterima', value: 'Rp 450.000', note: 'Siap ditarik' },
  ];

  const levels = [
    { level: 'Tingkat 1', percent: '10%', members: 12, bonus: 'Rp 300.000' },
    { level: 'Tingkat 2', percent: '3%', members: 4, bonus: 'Rp 100.000' },
    { level: 'Tingkat 3', percent: '1%', members: 2, bonus: 'Rp 50.000' },
  ];

  return (
    <div className="space-y-3 pt-1">
      {/* Referral Code Box */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500">Kode Undangan Anda</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield size={11} /> Aktif
          </span>
        </div>
        <div className="flex items-center justify-between bg-[#F4F7FA] rounded-xl p-3 border border-slate-200/60">
          <span className="text-base font-black tracking-widest text-[#0B1528] font-mono">
            {referralCode}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-[#0B1528] text-[#E5A93C] text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Grid Statistik Tim */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">{s.label}</p>
            <p className="text-base font-black text-[#0B1528] mt-0.5">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Rincian Komisi Generasi */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Struktur Rabat Tim
        </h3>
        <div className="space-y-2.5">
          {levels.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0B1528] flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.level} ({item.percent})</p>
                  <p className="text-[10px] text-slate-400">{item.members} Anggota</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600">{item.bonus}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
