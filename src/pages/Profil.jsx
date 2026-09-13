import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  History, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TransactionHistoryModal from '../components/modals/TransactionHistoryModal';

export default function Profil() {
  const [profile, setProfile] = useState({
    username: 'Investor IndoInvestma',
    referral_code: 'INDO888',
    balance: 0,
    vip_level: 0,
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();

        if (error) throw error;
        if (data) {
          setProfile({
            username: data.username || 'Investor IndoInvestma',
            referral_code: data.referral_code || 'INDO888',
            balance: Number(data.balance || 0),
            vip_level: data.vip_level || 0,
          });
        }
      } catch (err) {
        console.error('Gagal mengambil data profil:', err.message);
      }
    }

    fetchProfile();
  }, []);

  const menuItems = [
    {
      id: 'history',
      icon: History,
      title: 'Riwayat Transaksi',
      desc: 'Catatan mutasi saldo, deposit & penarikan',
      action: () => setIsHistoryOpen(true),
    },
    {
      id: 'bank',
      icon: CreditCard,
      title: 'Rekening Penarikan',
      desc: 'Kelola nomor rekening bank & e-wallet',
      action: () => alert('Pengaturan rekening bank tersimpan.'),
    },
    {
      id: 'security',
      icon: ShieldCheck,
      title: 'Keamanan Akun',
      desc: 'PIN transaksi & otentikasi login',
      action: () => alert('Fitur keamanan PIN aktif.'),
    },
    {
      id: 'help',
      icon: HelpCircle,
      title: 'Pusat Bantuan',
      desc: 'Pertanyaan umum & panduan aplikasi',
      action: () => alert('Menghubungkan ke Pusat Bantuan IndoInvestma...'),
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Kartu Profil Investor */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0B1528] text-[#E5A93C] flex items-center justify-center font-black text-xl shadow-md border border-amber-400/20">
          <User size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-[#0B1528] truncate">
              {profile.username}
            </h3>
            <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
              <Sparkles size={10} /> VIP {profile.vip_level}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            ID: {profile.referral_code}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <ShieldCheck size={12} /> Akun Terverifikasi
          </div>
        </div>
      </div>

      {/* Menu Navigasi Pengaturan */}
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-50">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl transition-all active:scale-[0.99] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{item.title}</h4>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          );
        })}
      </div>

      {/* Tombol Keluar Sesi */}
      <div className="px-1">
        <button
          onClick={() => alert('Sesi akun berhasil diamankan.')}
          className="w-full py-3 px-4 rounded-2xl border border-rose-200 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-rose-50"
        >
          <LogOut size={16} /> Keluar dari Akun
        </button>
      </div>

      {/* Modal Riwayat Transaksi */}
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
