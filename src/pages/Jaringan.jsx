import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Gift, Share2, Award, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Jaringan() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('INDO779');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferral() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .limit(1)
          .single();

        if (error) throw error;
        if (data?.referral_code) {
          setReferralCode(data.referral_code);
        }
      } catch (err) {
        console.error('Gagal mengambil data referral:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReferral();
  }, []);

  const referralLink = `https://indoinvestma.vercel.app/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm mt-1">
        <Loader2 className="animate-spin text-[#E5A93C]" size={24} />
        <p className="text-xs font-medium">Memuat data referral...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {/* Banner Program Afiliasi */}
      <div className="bg-[#0B1528] rounded-2xl p-4 text-white space-y-3 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E5A93C]/20 text-[#E5A93C] flex items-center justify-center">
            <Gift size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold">Komisi Afiliasi 3 Tingkat</h3>
            <p className="text-[10px] text-slate-400">Raih bonus pasif dari setiap siklus investasi tim</p>
          </div>
        </div>

        {/* Ringkasan Tingkatan Komisi */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
            <span className="text-[9px] text-slate-400 block">Level 1</span>
            <span className="text-xs font-extrabold text-[#E5A93C]">10%</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
            <span className="text-[9px] text-slate-400 block">Level 2</span>
            <span className="text-xs font-extrabold text-slate-200">5%</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
            <span className="text-[9px] text-slate-400 block">Level 3</span>
            <span className="text-xs font-extrabold text-slate-200">2%</span>
          </div>
        </div>
      </div>

      {/* Kotak Kode & Tautan Undangan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Tautan Undangan Anda</span>
          <span className="text-[10px] font-semibold text-[#E5A93C] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Kode: {referralCode}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="bg-transparent text-[11px] text-slate-600 flex-1 outline-none truncate font-mono"
          />
          <button
            onClick={handleCopy}
            className="bg-[#0B1528] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Status Statistik Jaringan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Users size={15} className="text-[#0B1528]" /> Ringkasan Anggota
        </h4>
        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Total Bawahan</span>
            <span className="text-sm font-black text-[#0B1528]">0 Orang</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Total Komisi</span>
            <span className="text-sm font-black text-emerald-600">Rp 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
