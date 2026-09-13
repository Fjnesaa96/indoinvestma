import React, { useState } from 'react';
import { ArrowDownRight, Loader2, X, CreditCard } from 'lucide-react';

export default function WithdrawModal({ isOpen, onClose, currentBalance, onWithdrawSuccess }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const minWithdraw = 25000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const nominal = Number(amount);

    if (!nominal || nominal < minWithdraw) {
      setErrorMsg(`Minimal penarikan adalah Rp ${minWithdraw.toLocaleString('id-ID')}`);
      return;
    }

    if (nominal > currentBalance) {
      setErrorMsg('Saldo tidak mencukupi untuk nominal penarikan ini.');
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      setErrorMsg('Silakan lengkapi nomor dan nama pemilik rekening.');
      return;
    }

    try {
      setLoading(true);
      await onWithdrawSuccess({
        nominal,
        bankName,
        accountNumber,
        accountName,
      });
      setAmount('');
      setAccountNumber('');
      setAccountName('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses penarikan dana.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#0B1528]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0B1528]">Tarik Saldo</h3>
              <p className="text-[10px] text-slate-400">
                Saldo: Rp {currentBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* Pesan Kesalahan */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] leading-tight">
            {errorMsg}
          </div>
        )}

        {/* Form Penarikan */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">
              Pilihan Bank / E-Wallet
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#E5A93C] focus:bg-white transition-all"
            >
              <option value="BCA">BCA (Bank Central Asia)</option>
              <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
              <option value="MANDIRI">Bank Mandiri</option>
              <option value="BNI">BNI (Bank Negara Indonesia)</option>
              <option value="DANA">DANA E-Wallet</option>
              <option value="OVO">OVO</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">
              Nomor Rekening / HP
            </label>
            <input
              type="number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 8821092837"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#E5A93C] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">
              Nama Pemilik Rekening
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Sesuai buku tabungan / e-wallet"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#E5A93C] focus:bg-white transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-600">Nominal Tarik (Rp)</label>
              <button
                type="button"
                onClick={() => setAmount(currentBalance.toString())}
                className="text-[9px] font-bold text-[#E5A93C] hover:underline"
              >
                Tarik Semua
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min. 25000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#E5A93C] focus:bg-white transition-all"
            />
          </div>

          {/* Tombol Eksekusi */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Ajukan Penarikan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
