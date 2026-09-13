import React from 'react';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  History, 
  HelpCircle, 
  Lock, 
  ChevronRight, 
  LogOut,
  Smartphone
} from 'lucide-react';

export default function Profil() {
  const menuItems = [
    {
      icon: CreditCard,
      label: 'Rekening Penarikan',
      sublabel: 'BCA •••• 8821',
      action: () => alert('Buka pengaturan rekening penarikan'),
    },
    {
      icon: History,
      label: 'Riwayat Transaksi',
      sublabel: 'Deposit, penarikan & profit',
      action: () => alert('Buka riwayat mutasi transaksi'),
    },
    {
      icon: Lock,
      label: 'Keamanan Akun',
      sublabel: 'PIN transaksi & kata sandi',
      action: () => alert('Buka pengaturan keamanan'),
    },
    {
      icon: HelpCircle,
      label: 'Layanan Bantuan 24/7',
      sublabel: 'Hubungi agen dukungan via chat',
      action: () => alert('Menghubungkan ke layanan CS...'),
    },
  ];

  return (
    <div className="space-y-3 pt-1">
      {/* Identity Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1528] text-[#E5A93C] flex items-center justify-center font-black text-lg shadow-sm">
            <User size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-[#0B1528]">Investor #7792</h3>
              <span className="text-[9px] font-bold text-[#E5A93C] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                VIP 0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Smartphone size={12} /> +62 812-••••-9210
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ShieldCheck size={12} /> KYC Aktif
          </span>
        </div>
      </div>

      {/* Account Settings Menu List */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-100">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.action}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 rounded-xl transition-colors active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-[#0B1528] flex items-center justify-center border border-slate-100">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="pt-1">
        <button
          onClick={() => alert('Konfirmasi keluar dari aplikasi IndoInvestma?')}
          className="w-full bg-white border border-rose-100 text-rose-500 font-bold text-xs py-3 rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-rose-50/40"
        >
          <LogOut size={16} /> Keluar Akun
        </button>
      </div>
    </div>
  );
}
