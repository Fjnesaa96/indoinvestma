import React, { useState } from 'react';
import { Eye, Bell, ShieldCheck, ArrowDownLeft, ArrowUpRight, TrendingUp, Users, PieChart, User, Home } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 pb-28 max-w-md mx-auto relative shadow-sm selection:bg-[#E5A93C] selection:text-white">
      {/* Top Header */}
      <header className="bg-[#0B1528] text-white px-5 pt-4 pb-6 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E5A93C] flex items-center justify-center font-black text-[#0B1528] text-sm">
              IN
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">IndoInvestma</h1>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sistem Aktif
              </p>
            </div>
          </div>
          <button className="p-2 rounded-xl bg-white/10 text-white/80 active:scale-95 transition-transform">
            <Bell size={18} />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-[#132238] border border-white/10 rounded-2xl p-4 mt-2 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Nilai Portofolio</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Eye size={15} />
            </button>
          </div>
          <div className="text-2xl font-black tracking-tight text-white mt-1">
            {showBalance ? 'Rp 1.000' : '••••••••'}
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
            <span>Level Akun: <strong className="text-[#E5A93C]">VIP 0</strong></span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-emerald-400">
              <ShieldCheck size={13} /> Terverifikasi
            </span>
          </div>
        </div>
      </header>

      {/* Main Action Content */}
      <main className="px-4 -mt-3">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Deposit</p>
              <p className="text-[10px] text-slate-400">Tambah Saldo</p>
            </div>
          </button>

          <button className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#E5A93C] flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800">Penarikan</p>
              <p className="text-[10px] text-slate-400">Tarik Saldo</p>
            </div>
          </button>
        </div>

        {/* Tab Status Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Halaman Aktif</p>
          <h2 className="text-lg font-bold capitalize text-[#0B1528] mt-0.5">{activeTab}</h2>
          <p className="text-xs text-slate-500 mt-1">Komponen dashboard siap dihubungkan ke modul data.</p>
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-3">
        <nav className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-3xl px-2 py-2 flex items-center justify-around">
          {[
            { id: 'jaringan', label: 'Jaringan', icon: Users },
            { id: 'market', label: 'Market', icon: TrendingUp },
            { id: 'beranda', label: 'Beranda', icon: Home, isCenter: true },
            { id: 'portfolio', label: 'Portfolio', icon: PieChart },
            { id: 'profil', label: 'Profil', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center -mt-5 transition-transform active:scale-95"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                      isActive
                        ? 'bg-[#0B1528] text-white shadow-[#0B1528]/30'
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-semibold mt-1 text-[#0B1528]">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center py-1 px-3 transition-colors active:scale-95"
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-[#0B1528] stroke-[2.5]' : 'text-slate-400 stroke-[1.8]'}
                />
                <span
                  className={`text-[11px] mt-1 ${
                    isActive ? 'text-[#0B1528] font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
