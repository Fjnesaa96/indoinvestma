const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const INVESTMENT_PACKAGES = [
  { id: 'vip1', tier: 'VIP', name: 'VIP 1', price: 100000, dailyProfit: 80000, durationDays: 4, totalProfit: 320000 },
  { id: 'vip2', tier: 'VIP', name: 'VIP 2', price: 300000, dailyProfit: 170000, durationDays: 4, totalProfit: 680000 },
  { id: 'vip3', tier: 'VIP', name: 'VIP 3', price: 1100000, dailyProfit: 550000, durationDays: 7, totalProfit: 3850000 },
  { id: 'vip4', tier: 'VIP', name: 'VIP 4', price: 3800000, dailyProfit: 1700000, durationDays: 14, totalProfit: 23800000 },
  { id: 'vip5', tier: 'VIP', name: 'VIP 5', price: 9000000, dailyProfit: 5000000, durationDays: 14, totalProfit: 70000000 },
  { id: 'vvip1', tier: 'VVIP', name: 'VVIP 1', price: 21000000, dailyProfit: 15000000, durationDays: 7, totalProfit: 105000000 },
  { id: 'vvip2', tier: 'VVIP', name: 'VVIP 2', price: 45000000, dailyProfit: 35000000, durationDays: 4, totalProfit: 140000000 },
  { id: 'vvip3', tier: 'VVIP', name: 'VVIP 3', price: 70000000, dailyProfit: 100000000, durationDays: 3, totalProfit: 300000000 }
];

function generateReferralCode() {
  return 'ID' + Math.floor(100000 + Math.random() * 900000);
}

async function syncUserProfit(userId) {
  if (!supabase) return 0;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const { data: investments } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!investments || investments.length === 0) return 0;
  let totalProfit = 0;

  for (const inv of investments) {
    if (inv.days_paid < inv.duration_days) {
      const lastPayout = new Date(inv.last_payout_at).getTime();
      const daysPassed = Math.floor((now - lastPayout) / ONE_DAY_MS);

      if (daysPassed > 0) {
        const payableDays = Math.min(daysPassed, inv.duration_days - inv.days_paid);
        const profit = payableDays * Number(inv.daily_profit);
        const newDaysPaid = inv.days_paid + payableDays;
        const newPayoutTime = new Date(lastPayout + (payableDays * ONE_DAY_MS)).toISOString();
        const newStatus = newDaysPaid >= inv.duration_days ? 'completed' : 'active';

        await supabase.from('investments').update({
          days_paid: newDaysPaid,
          last_payout_at: newPayoutTime,
          status: newStatus
        }).eq('id', inv.id);

        await supabase.from('transactions').insert([{
          id: 'PRF' + Date.now() + Math.floor(Math.random() * 1000),
          user_id: userId,
          type: 'profit',
          amount: profit,
          fee: 0,
          net_amount: profit,
          status: 'completed',
          payment_method: 'system',
          account_info: { investment_id: inv.id, package_name: inv.package_name }
        }]);

        totalProfit += profit;
      }
    }
  }

  if (totalProfit > 0) {
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const updated = Number(user.balance || 0) + totalProfit;
    await supabase.from('users').update({ balance: updated }).eq('id', userId);
  }

  return totalProfit;
}

app.get('/api/packages', (req, res) => {
  return res.status(200).json({ success: true, data: INVESTMENT_PACKAGES });
});

app.post('/api/register', async (req, res) => {
  const { phone, password, shareCode } = req.body || {};
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Nomor HP dan sandi wajib diisi.' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Sandi minimal 6 karakter.' });
  if (!supabase) return res.status(500).json({ success: false, message: 'Database Supabase belum aktif.' });

  try {
    const cleanPhone = phone.replace(/\s+/g, '');
    const { data: existing } = await supabase.from('users').select('id').eq('phone', cleanPhone).maybeSingle();
    if (existing) return res.status(409).json({ success: false, message: 'Nomor HP sudah terdaftar.' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRef = generateReferralCode();

    const { data: newUser, error } = await supabase.from('users').insert([{
      phone: cleanPhone,
      password_hash: passwordHash,
      share_code: shareCode ? shareCode.trim().toUpperCase() : null,
      user_referral_code: userRef,
      balance: 0,
      role: 'user'
    }]).select('id, phone, share_code, user_referral_code, balance').single();

    if (error) throw error;
    return res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan masuk.', data: newUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal registrasi.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Nomor HP dan sandi wajib diisi.' });
  if (!supabase) return res.status(500).json({ success: false, message: 'Database Supabase belum aktif.' });

  try {
    const cleanPhone = phone.replace(/\s+/g, '');
    const { data: user, error } = await supabase.from('users').select('*').eq('phone', cleanPhone).maybeSingle();
    if (error || !user) return res.status(401).json({ success: false, message: 'Nomor HP atau sandi salah.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Nomor HP atau sandi salah.' });

    await syncUserProfit(user.id);
    const { data: fresh } = await supabase.from('users').select('*').eq('id', user.id).single();

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: { id: fresh.id, phone: fresh.phone, balance: Number(fresh.balance || 0), userReferralCode: fresh.user_referral_code }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal login.' });
  }
});

app.get('/api/user/sync', async (req, res) => {
  const { userId } = req.query;
  if (!userId || !supabase) return res.status(400).json({ success: false, message: 'Data tidak valid.' });

  try {
    await syncUserProfit(userId);
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const { data: invs } = await supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false });

    return res.status(200).json({ success: true, balance: Number(user.balance || 0), investments: invs || [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal sinkronisasi.' });
  }
});

app.get('/api/referrals', async (req, res) => {
  const { referralCode } = req.query;
  if (!referralCode || !supabase) return res.status(400).json({ success: false, message: 'Kode diperlukan.' });

  try {
    const { data: downlines } = await supabase.from('users').select('phone').eq('share_code', referralCode);
    return res.status(200).json({ success: true, count: downlines ? downlines.length : 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memuat mitra.' });
  }
});

app.post('/api/deposit', async (req, res) => {
  const { userId, amount } = req.body || {};
  const num = Number(amount);
  if (!userId || isNaN(num) || num < 50000 || !supabase) {
    return res.status(400).json({ success: false, message: 'Minimal deposit Rp 50.000.' });
  }

  try {
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const newBal = Number(user.balance || 0) + num;
    await supabase.from('users').update({ balance: newBal }).eq('id', userId);

    await supabase.from('transactions').insert([{
      id: 'DEP' + Date.now(),
      user_id: userId,
      type: 'deposit',
      amount: num,
      fee: 0,
      net_amount: num,
      status: 'completed',
      payment_method: 'QRIS Instant'
    }]);

    return res.status(200).json({ success: true, message: 'Deposit Rp ' + num.toLocaleString('id-ID') + ' berhasil masuk!', newBalance: newBal });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal deposit.' });
  }
});

app.post('/api/invest', async (req, res) => {
  const { userId, packageId } = req.body || {};
  const pkg = INVESTMENT_PACKAGES.find((p) => p.id === packageId);
  if (!userId || !pkg || !supabase) return res.status(400).json({ success: false, message: 'Paket tidak valid.' });

  try {
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const current = Number(user.balance || 0);
    if (current < pkg.price) {
      return res.status(400).json({ success: false, message: 'Saldo tidak cukup (Rp ' + current.toLocaleString('id-ID') + '). Silakan deposit.' });
    }

    const newBal = current - pkg.price;
    await supabase.from('users').update({ balance: newBal }).eq('id', userId);

    await supabase.from('investments').insert([{
      user_id: userId,
      package_id: pkg.id,
      package_name: pkg.name,
      price: pkg.price,
      daily_profit: pkg.dailyProfit,
      duration_days: pkg.durationDays,
      days_paid: 0,
      status: 'active'
    }]);

    await supabase.from('transactions').insert([{
      id: 'INV' + Date.now(),
      user_id: userId,
      type: 'investment',
      amount: pkg.price,
      fee: 0,
      net_amount: pkg.price,
      status: 'completed',
      payment_method: 'balance'
    }]);

    return res.status(200).json({ success: true, message: 'Berhasil mengaktifkan ' + pkg.name + '! Profit otomatis setiap 24 jam.', newBalance: newBal });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal investasi.' });
  }
});

app.post('/api/withdraw', async (req, res) => {
  const { userId, bankName, accountNumber, accountHolder, amount } = req.body || {};
  const num = Number(amount);
  if (!userId || !bankName || !accountNumber || !accountHolder || isNaN(num) || num < 50000 || !supabase) {
    return res.status(400).json({ success: false, message: 'Minimal penarikan Rp 50.000.' });
  }

  try {
    await syncUserProfit(userId);
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const current = Number(user.balance || 0);
    if (current < num) {
      return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi (Rp ' + current.toLocaleString('id-ID') + ').' });
    }

    const fee = Math.round(num * 0.10);
    const net = num - fee;
    const newBal = current - num;
    await supabase.from('users').update({ balance: newBal }).eq('id', userId);

    await supabase.from('transactions').insert([{
      id: 'WD' + Date.now(),
      user_id: userId,
      type: 'withdraw',
      amount: num,
      fee: fee,
      net_amount: net,
      status: 'pending',
      payment_method: bankName,
      account_info: { accountNumber, accountHolder }
    }]);

    return res.status(200).json({
      success: true,
      message: 'Penarikan Rp ' + num.toLocaleString('id-ID') + ' diajukan! Biaya admin 10%: Rp ' + fee.toLocaleString('id-ID') + ', diterima bersih: Rp ' + net.toLocaleString('id-ID') + '.',
      newBalance: newBal
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal penarikan.' });
  }
});

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Indoinvestma</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; background-color: #000; -webkit-tap-highlight-color: transparent; }
    .ios-blur { backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
    .ios-card { background-color: #1c1c1e; border: 1px solid rgba(255, 255, 255, 0.08); }
    .ios-sep { height: 0.5px; background-color: rgba(255, 255, 255, 0.12); margin-left: 52px; }
  </style>
</head>
<body class="text-white flex justify-center min-h-screen">
  <div class="w-full max-w-md bg-black min-h-screen flex flex-col justify-between select-none relative">
    <header class="sticky top-0 z-30 ios-blur bg-black/75 border-b border-white/10 px-5 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-sm">IM</div>
        <span class="font-semibold text-base text-white">Indoinvestma</span>
      </div>
      <span class="text-[12px] font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">Official VIP</span>
    </header>

    <main id="authView" class="flex-1 px-5 pt-4 space-y-4">
      <section class="ios-card rounded-3xl p-5 relative overflow-hidden shadow-2xl">
        <p class="text-[11px] font-semibold text-amber-400 uppercase">Kemitraan Eksklusif</p>
        <h1 class="text-2xl font-bold text-white mt-1">Portofolio Digital Mitra</h1>
        <p class="text-xs text-neutral-400 mt-1">Dividen harian 24 jam otomatis masuk langsung ke saldo utama.</p>
        <div class="mt-3 pt-2 border-t border-white/10 flex justify-between text-xs">
          <span class="text-neutral-400">Kode Referral:</span>
          <span id="badgeCode" class="font-mono font-semibold text-amber-300">-</span>
        </div>
      </section>

      <div class="bg-[#1c1c1e] p-1 rounded-2xl flex border border-white/5">
        <button id="tabRegister" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#2c2c2e] text-white">Daftar Akun</button>
        <button id="tabLogin" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl text-neutral-400">Masuk</button>
      </div>

      <form id="authForm" class="space-y-4">
        <div class="ios-card rounded-2xl overflow-hidden">
          <div class="flex items-center px-4 py-3.5">
            <i class="fa-solid fa-phone text-sm text-neutral-400 w-6 text-center"></i>
            <span class="text-sm font-semibold text-neutral-300 ml-3 mr-2">+62</span>
            <input type="tel" id="phoneInput" placeholder="81234567890" required class="flex-1 bg-transparent text-sm text-white focus:outline-none">
          </div>
          <div class="ios-sep"></div>
          <div class="flex items-center px-4 py-3.5 relative">
            <i class="fa-solid fa-lock text-sm text-neutral-400 w-6 text-center"></i>
            <input type="password" id="passwordInput" placeholder="Kata Sandi (min. 6 karakter)" required class="flex-1 bg-transparent text-sm text-white focus:outline-none pl-3 pr-8">
            <button type="button" id="togglePassword" class="absolute right-4 text-neutral-400 hover:text-white"><i class="fa-regular fa-eye text-sm"></i></button>
          </div>
          <div id="referralRow">
            <div class="ios-sep"></div>
            <div class="flex items-center px-4 py-3.5">
              <i class="fa-solid fa-ticket text-sm text-amber-400 w-6 text-center"></i>
              <input type="text" id="shareCodeInput" placeholder="Kode Undangan (Opsional)" class="flex-1 bg-transparent text-sm text-amber-300 font-mono focus:outline-none pl-3 uppercase">
            </div>
          </div>
        </div>
        <div id="feedbackBox" class="hidden text-xs px-4 py-3 rounded-xl font-medium text-center"></div>
        <button type="submit" id="btnSubmit" class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold py-3.5 rounded-2xl text-[16px] shadow-lg active:scale-98">
          <span id="btnText">Daftar Sekarang</span>
        </button>
      </form>
    </main>

    <main id="dashboardView" class="hidden flex-1 px-5 pt-4 space-y-4 pb-8">
      <section class="ios-card rounded-3xl p-5 relative overflow-hidden shadow-2xl bg-gradient-to-b from-[#242426] to-[#1c1c1e]">
        <div class="flex items-center justify-between text-neutral-400 text-xs">
          <span>Saldo Utama Portofolio</span>
          <span class="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold">24H AUTO PROFIT</span>
        </div>
        <div class="mt-2.5 flex items-baseline justify-between">
          <div><span class="text-xs font-semibold text-amber-400">Rp</span><h2 id="userBalance" class="text-3xl font-extrabold text-white inline ml-1">0</h2></div>
          <div class="flex space-x-2">
            <button id="btnOpenDeposit" type="button" class="bg-emerald-500 text-black text-xs font-extrabold px-3 py-2 rounded-xl active:scale-95 flex items-center space-x-1">
              <i class="fa-solid fa-plus text-[10px]"></i><span>Deposit</span>
            </button>
            <button id="btnOpenWithdraw" type="button" class="bg-amber-400 text-black text-xs font-extrabold px-3 py-2 rounded-xl active:scale-95 flex items-center space-x-1">
              <i class="fa-solid fa-arrow-up-from-bracket text-[10px]"></i><span>Tarik</span>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs text-neutral-400">
          <span id="userPhone" class="font-mono">+62-</span>
          <span class="text-amber-400 font-medium">Biaya Penarikan: 10%</span>
        </div>
      </section>

      <section class="ios-card rounded-2xl p-4 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2"><i class="fa-solid fa-users text-amber-400 text-sm"></i><span class="text-xs font-semibold">Tautan Referral Anda</span></div>
          <span id="userMyRefCode" class="font-mono text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">-</span>
        </div>
        <button id="btnCopyRef" type="button" class="w-full bg-[#2c2c2e] text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 flex items-center justify-center space-x-2">
          <i class="fa-regular fa-copy"></i><span id="copyText">Salin Tautan Undangan</span>
        </button>
        <div class="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
          <span>Mitra Terdaftar:</span><span id="referralCount" class="font-bold text-white">0 Mitra</span>
        </div>
      </section>

      <section id="activePortoSection" class="hidden space-y-2">
        <h3 class="text-sm font-bold text-white">Portofolio Aktif Saya</h3>
        <div id="activePortoList" class="space-y-2"></div>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-bold text-white">Katalog Paket Investasi</h3>
        <div id="packageList" class="space-y-3"></div>
      </section>

      <button id="btnLogout" type="button" class="w-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold py-3.5 rounded-xl mt-4">Keluar dari Sesi</button>
    </main>

    <div id="depositModal" class="hidden fixed inset-0 z-50 bg-black/80 ios-blur flex flex-col justify-end p-4">
      <div class="ios-card rounded-3xl p-5 space-y-4 max-w-md w-full mx-auto border border-white/10">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div><h4 class="text-base font-bold text-white">Deposit Otomatis</h4><p class="text-[11px] text-neutral-400">QRIS & Instant Virtual Account</p></div>
          <button id="btnCloseDeposit" type="button" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="depositForm" class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <button type="button" onclick="setDep(100000)" class="bg-[#2c2c2e] text-xs py-2 rounded-xl font-bold border border-white/5">100.000</button>
            <button type="button" onclick="setDep(300000)" class="bg-[#2c2c2e] text-xs py-2 rounded-xl font-bold border border-white/5">300.000</button>
            <button type="button" onclick="setDep(1100000)" class="bg-[#2c2c2e] text-xs py-2 rounded-xl font-bold border border-white/5">1.100.000</button>
          </div>
          <input type="number" id="depAmount" min="50000" step="1000" placeholder="Minimal Rp 50.000" required class="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none">
          <button type="submit" class="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-bold text-xs py-3 rounded-xl">Konfirmasi Bayar</button>
        </form>
      </div>
    </div>

    <div id="withdrawModal" class="hidden fixed inset-0 z-50 bg-black/80 ios-blur flex flex-col justify-end p-4">
      <div class="ios-card rounded-3xl p-5 space-y-3 max-w-md w-full mx-auto border border-white/10">
        <div class="flex items-center justify-between border-b border-white/10 pb-2">
          <div><h4 class="text-base font-bold text-white">Tarik Saldo</h4><p class="text-[11px] text-neutral-400">Biaya admin 10%</p></div>
          <button id="btnCloseWithdraw" type="button" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="withdrawForm" class="space-y-2.5">
          <select id="wdBank" required class="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
            <option value="BCA">BCA</option><option value="BRI">BRI</option><option value="MANDIRI">Mandiri</option><option value="BNI">BNI</option><option value="DANA">DANA</option><option value="OVO">OVO</option><option value="GOPAY">GoPay</option>
          </select>
          <input type="text" id="wdAccountNum" placeholder="Nomor Rekening / E-Wallet" required class="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
          <input type="text" id="wdAccountName" placeholder="Nama Pemilik Rekening" required class="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white">
          <input type="number" id="wdAmount" min="50000" step="1000" placeholder="Nominal Tarik (Min. Rp 50.000)" required class="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono">
          <div class="bg-black/50 p-2.5 rounded-xl border border-white/5 text-xs space-y-1">
            <div class="flex justify-between text-neutral-400"><span>Tarik:</span><span id="pwAmount" class="text-white font-mono">Rp 0</span></div>
            <div class="flex justify-between text-rose-400"><span>Admin (10%):</span><span id="pwFee" class="font-mono">-Rp 0</span></div>
            <div class="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1"><span>Diterima:</span><span id="pwNet" class="font-mono">Rp 0</span></div>
          </div>
          <button type="submit" class="w-full bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-bold text-xs py-3 rounded-xl">Konfirmasi Penarikan</button>
        </form>
      </div>
    </div>

    <footer class="text-center px-5 py-3 border-t border-white/5"><p class="text-[11px] text-neutral-500">© 2026 Indoinvestma Technologies. All rights reserved.</p></footer>
  </div>

  <script>
    var urlParams = new URLSearchParams(window.location.search);
    var codeFromUrl = urlParams.get('shareCode') || urlParams.get('ref') || '';
    var authView = document.getElementById('authView');
    var dashboardView = document.getElementById('dashboardView');
    var tabRegister = document.getElementById('tabRegister');
    var tabLogin = document.getElementById('tabLogin');
    var referralRow = document.getElementById('referralRow');
    var badgeCode = document.getElementById('badgeCode');
    var shareCodeInput = document.getElementById('shareCodeInput');
    var phoneInput = document.getElementById('phoneInput');
    var passwordInput = document.getElementById('passwordInput');
    var togglePassword = document.getElementById('togglePassword');
    var authForm = document.getElementById('authForm');
    var btnSubmit = document.getElementById('btnSubmit');
    var btnText = document.getElementById('btnText');
    var feedbackBox = document.getElementById('feedbackBox');

    var userBalance = document.getElementById('userBalance');
    var userPhone = document.getElementById('userPhone');
    var userMyRefCode = document.getElementById('userMyRefCode');
    var referralCount = document.getElementById('referralCount');
    var btnCopyRef = document.getElementById('btnCopyRef');
    var copyText = document.getElementById('copyText');
    var btnLogout = document.getElementById('btnLogout');
    var packageList = document.getElementById('packageList');
    var activePortoSection = document.getElementById('activePortoSection');
    var activePortoList = document.getElementById('activePortoList');

    var depositModal = document.getElementById('depositModal');
    var btnOpenDeposit = document.getElementById('btnOpenDeposit');
    var btnCloseDeposit = document.getElementById('btnCloseDeposit');
    var depositForm = document.getElementById('depositForm');
    var depAmount = document.getElementById('depAmount');

    var withdrawModal = document.getElementById('withdrawModal');
    var btnOpenWithdraw = document.getElementById('btnOpenWithdraw');
    var btnCloseWithdraw = document.getElementById('btnCloseWithdraw');
    var withdrawForm = document.getElementById('withdrawForm');
    var wdAmount = document.getElementById('wdAmount');
    var pwAmount = document.getElementById('pwAmount');
    var pwFee = document.getElementById('pwFee');
    var pwNet = document.getElementById('pwNet');

    var isRegisterMode = true;

    var savedSession = localStorage.getItem('indoinvestma_session');
    if (savedSession) {
      try { renderDashboard(JSON.parse(savedSession)); } catch (e) { localStorage.removeItem('indoinvestma_session'); }
    }

    if (codeFromUrl) {
      shareCodeInput.value = codeFromUrl;
      badgeCode.textContent = codeFromUrl;
    } else {
      badgeCode.textContent = 'NON-REFERRAL';
      badgeCode.className = 'font-mono font-semibold text-neutral-500';
    }

    tabRegister.onclick = function() {
      if (isRegisterMode) return;
      isRegisterMode = true;
      tabRegister.className = 'flex-1 py-2 text-xs font-semibold rounded-xl bg-[#2c2c2e] text-white';
      tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-xl text-neutral-400';
      referralRow.classList.remove('hidden');
      btnText.textContent = 'Daftar Sekarang';
      feedbackBox.classList.add('hidden');
    };

    tabLogin.onclick = function() {
      if (!isRegisterMode) return;
      isRegisterMode = false;
      tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-xl bg-[#2c2c2e] text-white';
      tabRegister.className = 'flex-1 py-2 text-xs font-semibold rounded-xl text-neutral-400';
      referralRow.classList.add('hidden');
      btnText.textContent = 'Masuk ke Akun';
      feedbackBox.classList.add('hidden');
    };

    togglePassword.onclick = function() {
      var isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      togglePassword.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
    };

    authForm.onsubmit = async function(e) {
      e.preventDefault();
      feedbackBox.classList.add('hidden');

      var raw = phoneInput.value.trim();
      if (raw.startsWith('0')) raw = raw.substring(1);
      var phone = '+62' + raw;
      var password = passwordInput.value;
      var shareCode = shareCodeInput.value.trim();

      btnSubmit.disabled = true;
      btnText.textContent = 'Memproses...';

      var endpoint = isRegisterMode ? '/api/register' : '/api/login';
      var payload = isRegisterMode ? { phone: phone, password: password, shareCode: shareCode } : { phone: phone, password: password };

      try {
        var res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Gagal terhubung.');

        feedbackBox.className = 'text-xs px-4 py-3 rounded-xl font-medium text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        feedbackBox.textContent = result.message;
        feedbackBox.classList.remove('hidden');

        if (isRegisterMode) {
          setTimeout(function() { tabLogin.click(); passwordInput.value = ''; }, 1200);
        } else {
          localStorage.setItem('indoinvestma_session', JSON.stringify(result.data));
          setTimeout(function() { renderDashboard(result.data); }, 800);
        }
      } catch (err) {
        feedbackBox.className = 'text-xs px-4 py-3 rounded-xl font-medium text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        feedbackBox.textContent = err.message;
        feedbackBox.classList.remove('hidden');
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = isRegisterMode ? 'Daftar Sekarang' : 'Masuk ke Akun';
      }
    };

    function renderDashboard(data) {
      authView.classList.add('hidden');
      dashboardView.classList.remove('hidden');
      userBalance.textContent = Number(data.balance || 0).toLocaleString('id-ID');
      userPhone.textContent = data.phone || '-';
      userMyRefCode.textContent = data.userReferralCode || '-';
      loadReferrals(data.userReferralCode);
      loadPackages();
      syncData(data.id);
    }

    async function syncData(userId) {
      try {
        var res = await fetch('/api/user/sync?userId=' + userId);
        var result = await res.json();
        if (result.success) {
          userBalance.textContent = Number(result.balance || 0).toLocaleString('id-ID');
          var session = JSON.parse(localStorage.getItem('indoinvestma_session') || '{}');
          session.balance = result.balance;
          localStorage.setItem('indoinvestma_session', JSON.stringify(session));

          if (result.investments && result.investments.length > 0) {
            activePortoSection.classList.remove('hidden');
            activePortoList.innerHTML = result.investments.map(function(inv) {
              return '<div class="ios-card rounded-xl p-3 flex items-center justify-between border ' + (inv.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 opacity-70') + '">' +
                '<div><span class="text-xs font-bold text-white">' + inv.package_name + '</span><p class="text-[11px] text-neutral-400">Dibayar: ' + inv.days_paid + '/' + inv.duration_days + ' Hari</p></div>' +
                '<span class="text-xs font-bold text-emerald-400 font-mono">+Rp ' + Number(inv.daily_profit).toLocaleString('id-ID') + '/24h</span>' +
              '</div>';
            }).join('');
          } else {
            activePortoSection.classList.add('hidden');
          }
        }
      } catch (e) {}
    }

    async function loadReferrals(code) {
      try {
        var res = await fetch('/api/referrals?referralCode=' + code);
        var result = await res.json();
        if (result.success) referralCount.textContent = result.count + ' Mitra';
      } catch (e) {}
    }

    async function loadPackages() {
      try {
        var res = await fetch('/api/packages');
        var result = await res.json();
        if (result.success) {
          packageList.innerHTML = result.data.map(function(pkg) {
            var isVvip = pkg.tier === 'VVIP';
            var badgeBg = isVvip ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            var btnBg = isVvip ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-black';
            return '<div class="ios-card rounded-2xl p-4 flex flex-col space-y-3">' +
              '<div class="flex items-center justify-between">' +
                '<div class="flex items-center space-x-2"><span class="font-extrabold text-sm text-white">' + pkg.name + '</span><span class="text-[10px] px-2 py-0.5 rounded-full font-bold border ' + badgeBg + '">' + pkg.durationDays + ' HARI</span></div>' +
                '<span class="text-xs font-black text-amber-400">Rp ' + pkg.price.toLocaleString('id-ID') + '</span>' +
              '</div>' +
              '<div class="grid grid-cols-2 gap-2 text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/5">' +
                '<div><span class="text-neutral-500 block text-[10px]">Profit Harian:</span><span class="text-emerald-400 font-bold">+Rp ' + pkg.dailyProfit.toLocaleString('id-ID') + '/24h</span></div>' +
                '<div><span class="text-neutral-500 block text-[10px]">Total Dividen:</span><span class="text-white font-bold">Rp ' + pkg.totalProfit.toLocaleString('id-ID') + '</span></div>' +
              '</div>' +
              '<button onclick="handleInvest(\'' + pkg.id + '\')" class="w-full font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1 ' + btnBg + '">' +
                '<span>Aktifkan Paket</span><i class="fa-solid fa-chevron-right text-[10px]"></i>' +
              '</button>' +
            '</div>';
          }).join('');
        }
      } catch (e) {}
    }

    window.handleInvest = async function(pkgId) {
      var session = JSON.parse(localStorage.getItem('indoinvestma_session') || '{}');
      if (!session.id) return;
      try {
        var res = await fetch('/api/invest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id, packageId: pkgId }) });
        var result = await res.json();
        alert(result.message);
        if (res.ok) {
          session.balance = result.newBalance;
          localStorage.setItem('indoinvestma_session', JSON.stringify(session));
          userBalance.textContent = Number(result.newBalance).toLocaleString('id-ID');
          syncData(session.id);
        }
      } catch (e) { alert('Gagal investasi.'); }
    };

    window.setDep = function(val) { depAmount.value = val; };
    btnOpenDeposit.onclick = function() { depositModal.classList.remove('hidden'); };
    btnCloseDeposit.onclick = function() { depositModal.classList.add('hidden'); };

    depositForm.onsubmit = async function(e) {
      e.preventDefault();
      var session = JSON.parse(localStorage.getItem('indoinvestma_session') || '{}');
      if (!session.id) return;
      try {
        var res = await fetch('/api/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: session.id, amount: Number(depAmount.value) }) });
        var result = await res.json();
        alert(result.message);
        if (res.ok) {
          session.balance = result.newBalance;
          localStorage.setItem('indoinvestma_session', JSON.stringify(session));
          userBalance.textContent = Number(result.newBalance).toLocaleString('id-ID');
          depositForm.reset();
          depositModal.classList.add('hidden');
        }
      } catch (e) { alert('Gagal deposit.'); }
    };

    btnOpenWithdraw.onclick = function() { withdrawModal.classList.remove('hidden'); };
    btnCloseWithdraw.onclick = function() { withdrawModal.classList.add('hidden'); };

    wdAmount.oninput = function() {
      var val = Number(wdAmount.value) || 0;
      var fee = Math.round(val * 0.10);
      var net = Math.max(0, val - fee);
      pwAmount.textContent = 'Rp ' + val.toLocaleString('id-ID');
      pwFee.textContent = '-Rp ' + fee.toLocaleString('id-ID');
      pwNet.textContent = 'Rp ' + net.toLocaleString('id-ID');
    };

    withdrawForm.onsubmit = async function(e) {
      e.preventDefault();
      var session = JSON.parse(localStorage.getItem('indoinvestma_session') || '{}');
      if (!session.id) return;

      var payload = {
        userId: session.id,
        bankName: document.getElementById('wdBank').value,
        accountNumber: document.getElementById('wdAccountNum').value.trim(),
        accountHolder: document.getElementById('wdAccountName').value.trim(),
        amount: Number(wdAmount.value)
      };

      try {
        var res = await fetch('/api/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var result = await res.json();
        alert(result.message);
        if (res.ok) {
          session.balance = result.newBalance;
          localStorage.setItem('indoinvestma_session', JSON.stringify(session));
          userBalance.textContent = Number(result.newBalance).toLocaleString('id-ID');
          withdrawForm.reset();
          pwAmount.textContent = 'Rp 0';
          pwFee.textContent = '-Rp 0';
          pwNet.textContent = 'Rp 0';
          withdrawModal.classList.add('hidden');
        }
      } catch (e) { alert('Gagal penarikan.'); }
    };

    btnCopyRef.onclick = function() {
      var code = userMyRefCode.textContent;
      navigator.clipboard.writeText(window.location.origin + '/?shareCode=' + code).then(function() {
        copyText.textContent = 'Tautan Berhasil Disalin!';
        setTimeout(function() { copyText.textContent = 'Salin Tautan Undangan'; }, 2000);
      });
    };

    btnLogout.onclick = function() {
      localStorage.removeItem('indoinvestma_session');
      dashboardView.classList.add('hidden');
      authView.classList.remove('hidden');
      tabLogin.click();
    };
  </script>
</body>
</html>`;

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlContent);
});

module.exports = app;
