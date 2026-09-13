import React, { useState } from 'react';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import BalanceCard from './components/cards/BalanceCard';
import Market from './pages/Market';
import Jaringan from './pages/Jaringan';
import Portfolio from './pages/Portfolio';
import Profil from './pages/Profil';

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 pb-28 max-w-md mx-auto relative shadow-sm selection:bg-[#E5A93C] selection:text-white">
      {/* Header Statis Atas */}
      <header className="bg-[#0B1528] text-white px-5 pt-4 pb-6 rounded-b-[2rem] shadow-md">
        <Header onOpenCS={() => alert('Menghubungkan ke layanan CS IndoInvestma...')} />
        <BalanceCard
          balance={1000}
          vipLevel={0}
          onDeposit={() => alert('Fitur Deposit Saldo')}
          onWithdraw={() => alert('Fitur Penarikan Saldo')}
        />
      </header>

      {/* Tampilan Halaman Berdasarkan Tab Aktif */}
      <main className="px-4 mt-3">
        {activeTab === 'beranda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Paket Investasi Pilihan
              </h2>
              <button 
                onClick={() => setActiveTab('market')}
                className="text-xs font-semibold text-[#0B1528]"
              >
                Lihat Semua
              </button>
            </div>
            <Market />
          </div>
        )}

        {activeTab === 'market' && <Market />}
        {activeTab === 'jaringan' && <Jaringan />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'profil' && <Profil />}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
