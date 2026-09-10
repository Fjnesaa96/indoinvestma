const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Konfigurasi SUPABASE_URL atau SUPABASE_KEY belum disetel di Vercel.');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Data Master Katalog Paket Investasi
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

// Logika Akrual Profit Otomatis 24 Jam
async function syncUserProfit(supabase, userId) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const { data: investments, error: invError } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (invError || !investments) return 0;

  let totalAddedProfit = 0;

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

        await supabase
          .from('investments')
          .update({
            days_paid: newDaysPaid,
            last_payout_at: newPayoutTime,
            status: newStatus
          })
          .eq('id', inv.id);

        await supabase
          .from('transactions')
          .insert([{
            id: 'PRF' + Date.now() + Math.floor(Math.random() * 1000),
            user_id: userId,
            type: 'profit',
            amount: profit,
            fee: 0,
            net_amount: profit,
            status: 'completed',
            payment_method: 'system',
            account_info: { investment_id: inv.id, package_name: inv.package_name, days_credited: payableDays }
          }]);

        totalAddedProfit += profit;
      }
    }
  }

  if (totalAddedProfit > 0) {
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    const updatedBalance = Number(user.balance || 0) + totalAddedProfit;
    await supabase.from('users').update({ balance: updatedBalance }).eq('id', userId);
  }

  return totalAddedProfit;
}

// 1. Endpoint Katalog
app.get('/api/packages', (req, res) => {
  return res.status(200).json({ success: true, data: INVESTMENT_PACKAGES });
});

// 2. Endpoint Registrasi
app.post('/api/register', async (req, res) => {
  const { phone, password, shareCode } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Nomor handphone dan kata sandi wajib diisi.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
  }

  try {
    const supabase = getSupabase();
    const cleanPhone = phone.replace(/\s+/g, '');

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Nomor handphone sudah terdaftar.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userReferralCode = generateReferralCode();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        phone: cleanPhone,
        password_hash: passwordHash,
        share_code: shareCode ? shareCode.trim().toUpperCase() : null,
        user_referral_code: userReferralCode,
        balance: 0,
        role: 'user'
      }])
      .select('id, phone, share_code, user_referral_code, balance')
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan masuk.',
      data: newUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal registrasi.' });
  }
});

// 3. Endpoint Login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Nomor handphone dan kata sandi wajib diisi.' });
  }

  try {
    const supabase = getSupabase();
    const cleanPhone = phone.replace(/\s+/g, '');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Nomor handphone atau sandi salah.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Nomor handphone atau sandi salah.' });
    }

    await syncUserProfit(supabase, user.id);

    const { data: freshUser } = await supabase.from('users').select('*').eq('id', user.id).single();

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        id: freshUser.id,
        phone: freshUser.phone,
        balance: Number(freshUser.balance || 0),
        userReferralCode: freshUser.user_referral_code,
        role: freshUser.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal login.' });
  }
});

// 4. Endpoint Sinkronisasi User & Portofolio
app.get('/api/user/sync', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID diperlukan.' });
  }

  try {
    const supabase = getSupabase();
    await syncUserProfit(supabase, userId);

    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: investments } = await supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false });

    return res.status(200).json({
      success: true,
      balance: Number(user.balance || 0),
      investments: investments || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal sinkronisasi data.' });
  }
});

// 5. Endpoint Statistik Referral
app.get('/api/referrals', async (req, res) => {
  const { referralCode } = req.query;
  if (!referralCode) {
    return res.status(400).json({ success: false, message: 'Kode referral diperlukan.' });
  }

  try {
    const supabase = getSupabase();
    const { data: downlines, error } = await supabase
      .from('users')
      .select('phone, created_at')
      .eq('share_code', referralCode);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      count: downlines ? downlines.length : 0,
      members: (downlines || []).map((d) => ({
        phone: d.phone.substring(0, 6) + '****' + d.phone.slice(-2),
        date: d.created_at
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengambil data referral.' });
  }
});

// 6. Endpoint Deposit Otomatis (Instant QRIS Simulator)
app.post('/api/deposit', async (req, res) => {
  const { userId, amount, paymentMethod } = req.body || {};

  const numAmount = Number(amount);
  if (!userId || isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ success: false, message: 'Nominal deposit minimal Rp 50.000.' });
  }

  try {
    const supabase = getSupabase();
    const { data: user, error: uErr } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (uErr || !user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const txId = 'DEP' + Date.now();
    const newBalance = Number(user.balance || 0) + numAmount;

    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

    await supabase.from('transactions').insert([{
      id: txId,
      user_id: userId,
      type: 'deposit',
      amount: numAmount,
      fee: 0,
      net_amount: numAmount,
      status: 'completed',
      payment_method: paymentMethod || 'QRIS Instant',
      account_info: { auto_confirmed: true }
    }]);

    return res.status(200).json({
      success: true,
      message: `Deposit otomatis sebesar Rp ${numAmount.toLocaleString('id-ID')} berhasil masuk!`,
      newBalance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal memproses deposit.' });
  }
});

// 7. Endpoint Pembelian Investasi
app.post('/api/invest', async (req, res) => {
  const { userId, packageId } = req.body || {};

  if (!userId || !packageId) {
    return res.status(400).json({ success: false, message: 'Data investasi tidak lengkap.' });
  }

  const selectedPackage = INVESTMENT_PACKAGES.find((p) => p.id === packageId);
  if (!selectedPackage) {
    return res.status(404).json({ success: false, message: 'Paket investasi tidak ditemukan.' });
  }

  try {
    const supabase = getSupabase();
    const { data: user, error: uErr } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (uErr || !user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const currentBalance = Number(user.balance || 0);
    if (currentBalance < selectedPackage.price) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi (Saldo: Rp ${currentBalance.toLocaleString('id-ID')}). Silakan lakukan deposit.`
      });
    }

    const newBalance = currentBalance - selectedPackage.price;
    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

    await supabase.from('investments').insert([{
      user_id: userId,
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
      price: selectedPackage.price,
      daily_profit: selectedPackage.dailyProfit,
      duration_days: selectedPackage.durationDays,
      days_paid: 0,
      status: 'active'
    }]);

    await supabase.from('transactions').insert([{
      id: 'INV' + Date.now(),
      user_id: userId,
      type: 'investment',
      amount: selectedPackage.price,
      fee: 0,
      net_amount: selectedPackage.price,
      status: 'completed',
      payment_method: 'balance',
      account_info: { package_id: selectedPackage.id, package_name: selectedPackage.name }
    }]);

    return res.status(200).json({
      success: true,
      message: `Berhasil mengaktifkan ${selectedPackage.name}! Profit harian otomatis masuk setiap 24 jam.`,
      newBalance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal memproses investasi.' });
  }
});

// 8. Endpoint Penarikan Saldo (Fee 10%)
app.post('/api/withdraw', async (req, res) => {
  const { userId, bankName, accountNumber, accountHolder, amount } = req.body || {};

  const numAmount = Number(amount);
  if (!userId || !bankName || !accountNumber || !accountHolder || isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ success: false, message: 'Data penarikan tidak valid (Minimal penarikan Rp 50.000).' });
  }

  try {
    const supabase = getSupabase();
    await syncUserProfit(supabase, userId);

    const { data: user, error: uErr } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (uErr || !user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const currentBalance = Number(user.balance || 0);
    if (currentBalance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi untuk penarikan Rp ${numAmount.toLocaleString('id-ID')} (Saldo: Rp ${currentBalance.toLocaleString('id-ID')}).`
      });
    }

    const fee = Math.round(numAmount * 0.10);
    const netAmount = numAmount - fee;
    const newBalance = currentBalance - numAmount;

    await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

    const txId = 'WD' + Date.now();
    await supabase.from('transactions').insert([{
      id: txId,
      user_id: userId,
      type: 'withdraw',
      amount: numAmount,
      fee: fee,
      net_amount: netAmount,
      status: 'pending',
      payment_method: bankName,
      account_info: { account_number: accountNumber, account_holder: accountHolder }
    }]);

    return res.status(200).json({
      success: true,
      message: `Permintaan penarikan Rp ${numAmount.toLocaleString('id-ID')} berhasil diajukan! Biaya admin 10%: Rp ${fee.toLocaleString('id-ID')}, dana bersih yang ditransfer: Rp ${netAmount.toLocaleString('id-ID')}.`,
      newBalance
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Gagal mengajukan penarikan.' });
  }
});

// UI Frontend iOS
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Indoinvestma</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif;
      background-color: #000000;
      -webkit-font-smoothing: antialiased;
      -webkit-tap-highlight-color: transparent;
    }
    .ios-blur {
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
    }
    .ios-card {
      background-color: #1c1c1e;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .ios-separator {
      height: 0.5px;
      background-color: rgba(255, 255, 255, 0.12);
      margin-left: 52px;
    }
  </style>
</head>
<body class="text-white flex justify-center min-h-screen">
  <div class="w-full max-w-md bg-black min-h-screen flex flex-col justify-between select-none relative">

    <header class="sticky top-0 z-30 ios-blur bg-black/75 border-b border-white/10 px-5 pt-3 pb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-sm shadow-md">
            IM
          </div>
          <span class="font-semibold text-base tracking-tight text-white">Indoinvestma</span>
        </div>
        <span class="text-[12px] font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
          Official VIP
        </span>
      </div>
    </header>

    <!-- VIEW 1: AUTH -->
    <main id="authView" class="flex-1 px-5 pt-4 space-y-5">
      <section class="ios-card rounded-3xl p-5 relative overflow-hidden shadow-2xl">
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <p class="text-[11px] font-semibold tracking-wider uppercase text-amber-400">Akses Kemitraan Eksklusif</p>
        <h1 class="text-2xl font-bold tracking-tight mt-1 text-white leading-tight">Portofolio Digital Mitra</h1>
        <p class="text-xs text-neutral-400 mt-1.5 leading-relaxed">
          Kelola aset dan nikmati dividen harian otomatis setiap 24 jam langsung ke saldo Anda.
        </p>
        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-link text-xs text-neutral-400"></i>
            <span class="text-xs text-neutral-400 font-normal">Undangan Referral:</span>
          </div>
          <span id="badgeCode" class="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-amber-300 tracking-wider">-</span>
        </div>
      </section>

      <div class="bg-[#1c1c1e] p-1 rounded-2xl flex border border-white/5">
        <button id="tabRegister" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#2c2c2e] text-white shadow-sm transition">Daftar Akun</button>
        <button id="tabLogin" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl text-neutral-400 transition">Masuk</button>
      </div>

      <form id="authForm" class="space-y-4">
        <div class="ios-card rounded-2xl overflow-hidden">
          <div class="flex items-center px-4 py-3.5">
            <div class="w-6 text-center text-neutral-400"><i class="fa-solid fa-phone text-sm"></i></div>
            <span class="text-sm font-semibold text-neutral-300 ml-3 mr-2">+62</span>
            <input type="tel" id="phoneInput" placeholder="81234567890" required class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none">
          </div>
          <div class="ios-separator"></div>
          <div class="flex items-center px-4 py-3.5 relative">
            <div class="w-6 text-center text-neutral-400"><i class="fa-solid fa-lock text-sm"></i></div>
            <input type="password" id="passwordInput" placeholder="Kata Sandi (min. 6 karakter)" required class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none pl-3 pr-8">
            <button type="button" id="togglePassword" class="absolute right-4 text-neutral-400 hover:text-white"><i class="fa-regular fa-eye text-sm"></i></button>
          </div>
          <div id="referralRow">
            <div class="ios-separator"></div>
            <div class="flex items-center px-4 py-3.5">
              <div class="w-6 text-center text-amber-400"><i class="fa-solid fa-ticket text-sm"></i></div>
              <input type="text" id="shareCodeInput" placeholder="Kode Undangan (Opsional)" class="flex-1 bg-transparent text-sm text-amber-300 font-mono tracking-widest placeholder-neutral-500 focus:outline-none pl-3 uppercase">
            </div>
          </div>
        </div>

        <div id="feedbackBox" class="hidden text-xs px-4 py-3 rounded-xl font-medium text-center"></div>

        <button type="submit" id="btnSubmit" class="w-full bg-gradie
