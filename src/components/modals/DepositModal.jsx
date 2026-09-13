import React, { useState } from 'react';
import { Wallet, CheckCircle2, Loader2, X } from 'lucide-react';

export default function DepositModal({ isOpen, onClose, onDepositSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [50000, 100000, 250000, 500000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nominal = Number(amount);
    if (!nominal || nominal < 10000) {
      alert('Minimal top up saldo adalah Rp 10.000');
      return;
    }

    try {
      setLoading(true);
      await onDepositSuccess(nominal);
      setAmount('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0B1528]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#E5A93C] flex items-center justify-center border border-amber-200">
              <Wallet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0B1528]">Isi Saldo Akun</h3>
              <p className="text-[10px] text-slate-400">Instan & tanpa potongan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form Input Nominal */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Nominal Top Up (Rp)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 100000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#E5A93C] focus:bg-white transition-all"
            />
          </div>

          {/* Tombol Pilihan Cepat */}
          <div className="grid grid-cols-2 gap-1.5">
            {quickAmounts.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="py-1.5 px-2 bg-slate-50 hover:bg-amber-50/50 border border-slate-100 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-[#0B1528] active:scale-95 transition-all"
              >
                +Rp {val.toLocaleString('id-ID')}
              </button>
            ))}
          </div>

          {/* Tombol Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Konfirmasi Deposit'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
