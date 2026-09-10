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

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  return '+62' + digits;
}

function generateReferralCode() {
  return 'ID' + Math.floor(100000 + Math.random() * 900000);
}

async function syncUserProfit(userId) {
  if (!supabase || !userId) return 0;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const { data: investments, error: invErr } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (invErr || !investments || investments.length === 0) return 0;
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
      if (user) {
        const updated = Number(user.balance || 0) + totalProfit;
        await supabase.from('users').update({ balance: updated }).eq('id', userId);
      }
    }

    return totalProfit;
  } catch (e) {
    console.error('syncUserProfit error:', e);
    return 0;
  }
}

app.get('/api/packages', (req, res) => {
  return res.status(200).json({ success: true, data: INVESTMENT_PACKAGES });
});

app.post('/api/register', async (req, res) => {
  const { phone, password, shareCode } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Nomor HP dan kata sandi wajib diisi.' });
  }
  if (String(password).trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
  }
  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Database Supabase belum terkonfigurasi di Vercel.' });
  }

  try {
    const cleanPhone = normalizePhone(phone);
    const cleanPassword = String(password).trim();

    const { data: existingList, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1);

    if (checkError) {
      return res.status(500).json({ success: false, message: 'Database error: ' + checkError.message });
    }

    if (existingList && existingList.length > 0) {
      return res.status(409).json({ success: false, message: 'Nomor HP sudah terdaftar. Silakan pilih menu Masuk.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);
    const userRef = generateReferralCode();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        phone: cleanPhone,
        password_hash: passwordHash,
        share_code: shareCode ? String(shareCode).trim().toUpperCase() : null,
        user_referral_code: userRef,
        balance: 0,
        role: 'user'
      }])
      .select('id, phone, share_code, user_referral_code, balance')
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, message: 'Gagal membuat akun: ' + insertError.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Membuka dashboard...',
      data: {
        id: newUser.id,
        phone: newUser.phone,
        balance: Number(newUser.balance || 0),
        userReferralCode: newUser.user_referral_code
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal registrasi: ' + (err.message || 'Server error') });
  }
});

app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Nomor HP dan kata sandi wajib diisi.' });
  }
  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Database Supabase belum terkonfigurasi di Vercel.' });
  }

  try {
    const cleanPhone = normalizePhone(phone);
    const cleanPassword = String(password).trim();

    const { data: userList, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .limit(1);

    if (error) {
      return res.status(500).json({ success: false, message: 'Database error: ' + error.message });
    }

    const user = (userList && userList.length > 0) ? userList[0] : null;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Nomor handphone tidak terdaftar.' });
    }

    const match = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Kata sandi yang Anda masukkan salah.' });
    }

    await syncUserProfit(user.id);

    const { data: freshUser } = await supabase
      .from('users')
      .select('id, phone, balance, user_referral_code, role')
      .eq('id', user.id)
      .single();

    const targetUser = freshUser || user;

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        id: targetUser.id,
        phone: targetUser.phone,
        balance: Number(targetUser.balance || 0),
        userReferralCode: targetUser.user_referral_code,
        role: targetUser.role || 'user'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal login: ' + (err.message || 'Server error') });
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
        <button id="tabRegister" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl bg-[#2c2c2e] text-white shadow-sm transition">Daftar Akun</button>
        <button id="tabLogin" type="button" class="flex-1 py-2 text-xs font-semibold rounded-xl text-neutral-400 transition">Masuk</button>
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

        <div class="text-center pt-1">
          <p id="switchPrompt" class="text-xs text-neutral-400 cursor-pointer">
            Sudah punya akun? <span class="text-amber-400 font-bold underline">Masuk di sini</span>
          </p>
        </div>
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
        <div class="flex items-center justi
