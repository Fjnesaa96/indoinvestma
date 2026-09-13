import React, { useState } from 'react';
import { ArrowUpRight, X, AlertCircle, Building2, CreditCard, User, ReceiptPercent } from 'lucide-react';

export default function WithdrawModal({ isOpen, onClose, currentBalance, onWithdrawSuccess }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const rawAmount = Number(amount) || 0;
  const withdrawFee = Math.floor(rawAmount * 0.10); // Biaya penarikan 10%
  const netReceived = Math.max(0, rawAmount - withdrawFee);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (rawAmount < 50000) {
      setErrorMsg('Minimal penarikan dana adalah Rp 50.000.');
      return;
    }

    if (rawAmount > currentBalance) {
      setErrorMsg('Saldo akun Anda tidak mencukupi untuk jumlah penarikan ini.');
      return;
    }

    if (!accountNumber.trim() || !accountName.trim()) {
      setErrorMsg('Lengkapi nomor rekening dan nama pemilik rekening.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onWithdrawSuccess({
        nominal: rawAmount,
        fee: withdrawFee,
        netAmount: netReceived,
        bankName,
        accountNumber,
        accountName,
      });
      setAmount('');
      setAccountNumber('');
      setAccountName('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengajukan penarikan dana.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1528]/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0B1528]">Tarik Saldo</h3>
              <p className="text-[10px] text-slate-400">Transfer dana ke bank/e-wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        {/* Informasi Saldo Aktif */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Saldo Tersedia:</span>
          <span className="font-black text-slate-800">
            Rp {Number(currentBalance).toLocaleString('id-ID')}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Pilihan Bank */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Bank / E-Wallet Tujuan
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B1528] bg-white text-slate-700"
              >
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="DANA">DANA E-Wallet</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
              </select>
            </div>
          </div>

          {/* Nomor Rekening */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nomor Rekening / Akun
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                placeholder="Contoh: 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B1528] text-slate-800"
              />
            </div>
          </div>

          {/* Nama Pemilik */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nama Lengkap Pemilik Rekening
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nama sesuai buku tabungan"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#0B1528] text-slate-800"
              />
            </div>
          </div>

          {/* Nominal Penarikan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Nominal Penarikan (Rp)
            </label>
            <input
              type="number"
              placeholder="Minimal Rp 50.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B1528]"
            />
          </div>

          {/* Rincian Potongan Fee 10% */}
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 space-y-1 text-[10px]">
            <div className="flex justify-between text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ReceiptPercent size={12} className="text-amber-600" /> Biaya Layanan (10%):
              </span>
              <span className="font-bold text-rose-500">-Rp {withdrawFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-bold border-t border-amber-200/50 pt-1">
              <span>Dana Bersih Diterima:</span>
              <span className="text-emerald-600 font-extrabold">Rp {netReceived.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-transform"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#0B1528] text-[#E5A93C] text-xs font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Tarik Sekarang'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
