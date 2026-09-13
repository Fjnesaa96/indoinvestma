import React, { useState, useEffect } from 'react';
import { History, ArrowDownRight, ArrowUpRight, TrendingUp, ShoppingBag, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function TransactionHistoryModal({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchTransactions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Gagal mengambil mutasi:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [isOpen]);

  if (!isOpen) return null;

  const getTxDetails = (type) => {
    switch (type) {
      case 'deposit':
        return {
          icon: ArrowDownRight,
          label: 'Deposit Saldo',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          sign: '+',
        };
      case 'withdraw':
        return {
          icon: ArrowUpRight,
          label: 'Tarik Dana',
          color: 'text-rose-500 bg-rose-50 border-rose-100',
          sign: '-',
        };
      case 'invest':
        return {
          icon: ShoppingBag,
          label: 'Sewa Paket',
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          sign: '-',
        };
      case 'profit':
        return {
          icon: TrendingUp,
          label: 'Profit Harian',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          sign: '+',
        };
      default:
        return {
          icon: History,
          label: 'Transaksi',
          color: 'text-slate-600 bg-slate-50 border-slate-100',
          sign: '',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1528]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-[#0B1528] flex items-center justify-center border border-slate-100">
              <History size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0B1528]">Riwayat Transaksi</h3>
              <p className="text-[10px] text-slate-400">Mutasi saldo & aktivitas akun</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* Konten Riwayat */}
        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#E5A93C]" size={20} />
              <span className="text-xs">Memuat riwayat transaksi...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada riwayat transaksi tercatat.
            </div>
          ) : (
            transactions.map((tx) => {
              const details = getTxDetails(tx.type);
              const Icon = details.icon;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${details.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{details.label}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {tx.description || 'Mutasi sistem'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black ${details.sign === '+' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {details.sign}Rp {Number(tx.amount).toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-slate-400 uppercase font-semibold">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tombol Tutup */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold active:scale-95 transition-transform hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
