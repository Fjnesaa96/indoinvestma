import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import BalanceCard from './components/cards/BalanceCard';
import Market from './pages/Market';
import Jaringan from './pages/Jaringan';
import Portfolio from './pages/Portfolio';
import Profil from './pages/Profil';
import DepositModal from './components/modals/DepositModal';
import AlertModal from './components/modals/AlertModal';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [userProfile, setUserProfile] = useState({
    id: null,
    balance: 0,
    vip_level: 0,
  });

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, balance, vip_level')
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setUserProfile({
          id: data.id,
          balance: Number(data.balance),
          vip_level: data.vip_level,
        });
      }
    } catch (err) {
      console.error('Gagal memuat profil saldo:', err.message);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleDepositSuccess = async (nominal) => {
    if (!userProfile.id) return;

    const newBalance = userProfile.balance + nominal;

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userProfile.id);

    if (error) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Deposit Gagal',
        message: error.message,
      });
      return;
    }

    setUserProfile((prev) => ({ ...prev, balance: newBalance }));
    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Deposit Berhasil',
      message: `Saldo sebesar Rp ${nominal.toLocaleString('id-ID')} berhasil ditambahkan ke akun Anda.`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 pb-28 max-w-md mx-auto relative shadow-sm selection:bg-[#E5A93C] selection:text-white">
      {/* Header & Balance */}
      <header className="bg-[#0B1528] text-white px-5 pt-4 pb-6 rounded-b-[2rem] shadow-md">
        <Header onOpenCS={() => alert('Menghubungkan ke layanan CS IndoInvestma...')} />
        <BalanceCard
          balance={userProfile.balance}
          vipLevel={userProfile.vip_level}
          onDeposit={() => setIsDepositOpen(true)}
          onWithdraw={() => alert('Fitur Penarikan Saldo')}
        />
      </header>

      {/* Main Tabs */}
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

      {/* Floating Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={handleDepositSuccess}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
