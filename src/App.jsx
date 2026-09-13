import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import BalanceCard from './components/cards/BalanceCard';
import Market from './pages/Market';
import Jaringan from './pages/Jaringan';
import Portfolio from './pages/Portfolio';
import Profil from './pages/Profil';
import DepositModal from './components/modals/DepositModal';
import WithdrawModal from './components/modals/WithdrawModal';
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
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
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

  // Handler Sukses Deposit
  const handleDepositSuccess = async (nominal) => {
    if (!userProfile.id) return;
    const newBalance = userProfile.balance + nominal;

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userProfile.id);

    if (profileErr) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Deposit Gagal',
        message: profileErr.message,
      });
      return;
    }

    await supabase.from('transactions').insert([
      {
        type: 'deposit',
        amount: nominal,
        description: 'Top up saldo akun via Transfer Instant',
        status: 'success',
      },
    ]);

    setUserProfile((prev) => ({ ...prev, balance: newBalance }));
    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Deposit Berhasil',
      message: `Saldo sebesar Rp ${nominal.toLocaleString('id-ID')} berhasil ditambahkan.`,
    });
  };

  // Handler Sukses Penarikan Dana (Biaya Admin 10%)
  const handleWithdrawSuccess = async ({ nominal, fee, netAmount, bankName, accountNumber, accountName }) => {
    if (!userProfile.id) return;

    if (userProfile.balance < nominal) {
      throw new Error('Saldo tidak mencukupi untuk jumlah penarikan ini.');
    }

    const newBalance = userProfile.balance - nominal;

    // 1. Potong saldo utama
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userProfile.id);

    if (profileErr) throw profileErr;

    // 2. Catat riwayat penarikan dengan detail potongan 10%
    await supabase.from('transactions').insert([
      {
        type: 'withdraw',
        amount: nominal,
        description: `Tarik ke ${bankName} (${accountNumber}) a.n ${accountName} (Fee 10%: Rp ${fee.toLocaleString('id-ID')}, Diterima: Rp ${netAmount.toLocaleString('id-ID')})`,
        status: 'success',
      },
    ]);

    setUserProfile((prev) => ({ ...prev, balance: newBalance }));
    setAlertConfig({
      isOpen: true,
      type: 'success',
      title: 'Penarikan Berhasil Diajukan',
      message: `Pengajuan penarikan Rp ${nominal.toLocaleString('id-ID')} diproses.\nPotongan fee 10%: Rp ${fee.toLocaleString('id-ID')}\nDana bersih ditransfer: Rp ${netAmount.toLocaleString('id-ID')}\nTujuan: ${bankName} (${accountNumber}).`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-800 pb-28 max-w-md mx-auto relative shadow-sm selection:bg-[#E5A93C] selection:text-white">
      {/* Header & Kartu Saldo */}
      <header className="bg-[#0B1528] text-white px-5 pt-4 pb-6 rounded-b-[2rem] shadow-md">
        <Header onOpenCS={() => alert('Menghubungkan ke layanan CS IndoInvestma...')} />
        <BalanceCard
          balance={userProfile.balance}
          vipLevel={userProfile.vip_level}
          onDeposit={() => setIsDepositOpen(true)}
          onWithdraw={() => setIsWithdrawOpen(true)}
        />
      </header>

      {/* Navigasi Konten */}
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

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        currentBalance={userProfile.balance}
        onWithdrawSuccess={handleWithdrawSuccess}
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
