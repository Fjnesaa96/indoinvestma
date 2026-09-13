import React, { useState, useEffect } from 'react';
import ProductCard from '../components/cards/ProductCard';
import { supabase } from '../lib/supabaseClient';
import { Layers, Flame, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function Market() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeFilter, setActiveFilter] = useState('semua');

  // Ambil data paket langsung dari Supabase
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

        // Pemetaan format kolom Supabase (snake_case) ke props ProductCard (camelCase)
        const mappedData = (data || []).map((pkg) => ({
          id: pkg.id,
          title: pkg.title,
          price: pkg.price,
          dailyProfit: pkg.daily_profit,
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

  const handleInvest = (item) => {
    alert(`Konfirmasi sewa untuk ${item.title} seharga Rp ${Number(item.price).toLocaleString('id-ID')}`);
  };

  // Filter logika di sisi client
  const filteredProducts = products.filter((item) => {
    if (activeFilter === 'populer') return item.isPopular;
    if (activeFilter === 'pendek') return item.durationDays <= 30;
    return true;
  });

  return (
    <div className="space-y-4">
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

      {/* Daftar Produk Real-Time */}
      {!loading && !errorMsg && (
        <div>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                item={product}
                onInvest={handleInvest}
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
