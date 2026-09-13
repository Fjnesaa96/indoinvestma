import React, { useState } from 'react';
import ProductCard from '../components/cards/ProductCard';
import { Layers, Flame, Clock } from 'lucide-react';

const DUMMY_PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Paket Likuiditas Pemula',
    price: 50000,
    dailyProfit: 2500,
    durationDays: 30,
    progress: 82,
    isPopular: true,
  },
  {
    id: 'prod-2',
    title: 'Portofolio Ekuitas Stabil',
    price: 150000,
    dailyProfit: 8000,
    durationDays: 45,
    progress: 60,
    isPopular: false,
  },
  {
    id: 'prod-3',
    title: 'Akselerasi Pertumbuhan VIP',
    price: 500000,
    dailyProfit: 30000,
    durationDays: 60,
    progress: 35,
    isPopular: false,
  },
];

export default function Market() {
  const [activeFilter, setActiveFilter] = useState('semua');

  const handleInvest = (item) => {
    alert(`Konfirmasi sewa untuk ${item.title} seharga Rp ${Number(item.price).toLocaleString('id-ID')}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

      <div>
        {DUMMY_PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            item={product}
            onInvest={handleInvest}
          />
        ))}
      </div>
    </div>
  );
}
