import React, { useState, useEffect } from 'react';
import ProductCard from '../components/cards/ProductCard';
import ConfirmModal from '../components/modals/ConfirmModal';
import AlertModal from '../components/modals/AlertModal';
import { supabase } from '../lib/supabaseClient';
import { Layers, Flame, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function Market() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeFilter, setActiveFilter] = useState('semua');

  // State Modal Konfirmasi Sewa
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State Modal Status/Peringatan Kustom
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    async function fetchPackages() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data, error } = await supabase
          .from('packages')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;

        const mappedData = (data || []).map((pkg) => ({
          id: pkg.id,
          title: pkg.title,
          price: Number(pkg.price),
          dailyProfit: Number(pkg.daily_profit),
          durationDays: pkg.duration_days,
          progress: pkg.progress,
          isPopular: pkg.is_popular,
        }));

        setProducts(mappedData);
      } catch (err) {
        console.error('Gagal mengambil data produk:', err.message);
        setErrorMsg('Gagal memuat paket investasi dari server.');
      } finally {
        setLoading(false);
      }
    }

    fetchPackages();
  }, []);

  const handleInvestClick = (item) => {
    setSelectedProduct(item);
    setIsConfirmOpen(true);
  };

  const executeInvestment = async () => {
    if (!selectedProduct || isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. Ambil data saldo profil pengguna
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, balance')
        .limit(1)
        .single();

      if (profileErr) throw profileErr;

      const currentBalance = Number(profileData.balance || 0);

      // 2. Validasi kecukupan saldo
      if (currentBalance < selectedProduct.price) {
        setIsConfirmOpen(false);
        setAlertConfig({
          isOpen: true,
          type: 'error',
          title: 'Saldo Tidak Mencukupi',
          message: `Saldo aktif Anda: Rp ${currentBalance.toLocaleString('id-ID')}\nHarga paket: Rp ${selectedProduct.price.toLocaleString('id-ID')}\n\nSilakan lakukan deposit saldo terlebih dahulu untuk melanjutkan sewa.`,
        });
        return;
      }

      const newBalance = currentBalance - selectedProduct.price;

      // 3. Potong saldo di tabel profiles
      const { error: deductErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profileData.id);

      if (deductErr) throw deductErr;

      // 4. Tambah kontrak baru di tabel user_investments
      const { error: contractErr } = await supabase
        .from('user_investments')
        .insert([
          {
            title: selectedProduct.title,
            invested_amount: selectedProduct.price,
            daily_profit: selectedProduct.dailyProfit,
            days_remaining: selectedProduct.durationDays,
            total_days: selectedProduct.durationDays,
            earned_profit: 0,
            status: 'active',
          },
        ]);

      if (contractErr) throw contractErr;

      setIsConfirmOpen(false);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'Sewa Berhasil!',
        message: `Paket "${selectedProduct.title}" aktif. Saldo Anda sekarang Rp ${newBalance.toLocaleString('id-ID')}.`,
      });
    } catch (err) {
      console.error('Transaksi gagal:', err.message);
      setIsConfirmOpen(false);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'Transaksi Gagal',
        message: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    if (activeFilter === 'populer') return item.isPopular;
    if (activeFilter === 'pendek') return item.durationDays <= 30;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Modal Dialog Konfirmasi Sewa */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Konfirmasi Sewa Paket"
        message={
          selectedProduct
            ? `Sewa "${selectedProduct.title}" seharga Rp ${selectedProduct.price.toLocaleString('id-ID')} dengan estimasi profit Rp ${selectedProduct.dailyProfit.toLocaleString('id-ID')} / hari?`
            : ''
        }
        onConfirm={executeInvestment}
        onCancel={() => !isProcessing && setIsConfirmOpen(false)}
        loading={isProcessing}
      />

      {/* Modal Dialog Peringatan / Sukses Kustom */}
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'semua', label: 'Semua Paket', icon: Layers },
          { id: 'populer', label: 'Paling Diminati', icon: Flame },
          { id: 'pendek', label: 'Durasi Singkat', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#0B1528] text-[#E5A93C] shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="animate-spin text-[#E5A93C]" size={24} />
          <p className="text-xs font-medium">Sinkronisasi data cloud...</p>
        </div>
      )}

      {/* Error State */}
      {errorMsg && !loading && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center gap-2.5 text-xs">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Daftar Produk */}
      {!loading && !errorMsg && (
        <div>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                item={product}
                onInvest={handleInvestClick}
              />
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
              Tidak ada paket yang sesuai kategori ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
