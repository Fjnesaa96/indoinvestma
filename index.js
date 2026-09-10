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
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Helper generate kode referral unik
function generateReferralCode() {
  return 'ID' + Math.floor(100000 + Math.random() * 900000);
}

// Endpoint Registrasi Akun
app.post('/api/register', async (req, res) => {
  const { phone, password, shareCode } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nomor handphone dan kata sandi wajib diisi.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Kata sandi minimal 6 karakter.'
    });
  }

  const cleanPhone = phone.replace(/\s+/g, '');

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Database belum dikonfigurasi (SUPABASE_URL / SUPABASE_KEY kosong).'
    });
  }

  try {
    // 1. Cek nomor handphone duplikat
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Nomor handphone sudah terdaftar.'
      });
    }

    // 2. Hash kata sandi
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Simpan user baru ke database
    const userReferralCode = generateReferralCode();
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          phone: cleanPhone,
          password_hash: passwordHash,
          share_code: shareCode ? shareCode.trim().toUpperCase() : null,
          user_referral_code: userReferralCode,
          balance: 0
        }
      ])
      .select('id, phone, share_code, user_referral_code, balance, created_at')
      .single();

    if (insertError) {
      throw insertError;
    }

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan masuk ke akun.',
      data: {
        id: newUser.id,
        phone: newUser.phone,
        shareCode: newUser.share_code,
        userReferralCode: newUser.user_referral_code
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses registrasi: ' + (err.message || 'Server error')
    });
  }
});

// Endpoint Login Akun
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body || {};

  if (!phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nomor handphone dan kata sandi wajib diisi.'
    });
  }

  const cleanPhone = phone.replace(/\s+/g, '');

  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Database belum dikonfigurasi (SUPABASE_URL / SUPABASE_KEY kosong).'
    });
  }

  try {
    // 1. Ambil data user berdasarkan nomor handphone
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Nomor handphone atau kata sandi salah.'
      });
    }

    // 2. Verifikasi hash kata sandi
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nomor handphone atau kata sandi salah.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        id: user.id,
        phone: user.phone,
        balance: user.balance,
        userReferralCode: user.user_referral_code
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses login: ' + (err.message || 'Server error')
    });
  }
});

// UI Frontend iOS Cupertino Style
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
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
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
  <div class="w-full max-w-md bg-black min-h-screen flex flex-col justify-between pb-8 select-none">

    <!-- Top Navigation -->
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

    <main class="flex-1 px-5 pt-4 space-y-5">

      <!-- Hero Card -->
      <section class="ios-card rounded-3xl p-5 relative overflow-hidden shadow-2xl">
        <div class="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <p class="text-[11px] font-semibold tracking-wider uppercase text-amber-400">Akses Kemitraan Eksklusif</p>
        <h1 class="text-2xl font-bold tracking-tight mt-1 text-white leading-tight">Portofolio Digital Mitra</h1>
        <p class="text-xs text-neutral-400 mt-1.5 leading-relaxed">
          Kelola aset dan nikmati bagi hasil terverifikasi melalui ekosistem investasi modern.
        </p>

        <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-link text-xs text-neutral-400"></i>
            <span class="text-xs text-neutral-400 font-normal">Undangan Referral:</span>
          </div>
          <span id="badgeCode" class="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-amber-300 tracking-wider">
            -
          </span>
        </div>
      </section>

      <!-- Segmented Switcher -->
      <div class="bg-[#1c1c1e] p-1 rounded-2xl flex border border-white/5">
        <button 
          id="tabRegister" 
          type="button" 
          class="flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 bg-[#2c2c2e] text-white shadow-sm"
        >
          Daftar Akun
        </button>
        <button 
          id="tabLogin" 
          type="button" 
          class="flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 text-neutral-400"
        >
          Masuk
        </button>
      </div>

      <!-- Inset Grouped Form -->
      <form id="authForm" class="space-y-4">
        <div class="ios-card rounded-2xl overflow-hidden">
          
          <div class="flex items-center px-4 py-3.5">
            <div class="w-6 text-center text-neutral-400">
              <i class="fa-solid fa-phone text-sm"></i>
            </div>
            <span class="text-sm font-semibold text-neutral-300 ml-3 mr-2">+62</span>
            <input 
              type="tel" 
              id="phoneInput" 
              placeholder="81234567890" 
              required
              class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-normal"
            >
          </div>

          <div class="ios-separator"></div>

          <div class="flex items-center px-4 py-3.5 relative">
            <div class="w-6 text-center text-neutral-400">
              <i class="fa-solid fa-lock text-sm"></i>
            </div>
            <input 
              type="password" 
              id="passwordInput" 
              placeholder="Kata Sandi (min. 6 karakter)" 
              required
              class="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none pl-3 pr-8 font-normal"
            >
            <button 
              type="button" 
              id="togglePassword" 
              class="absolute right-4 text-neutral-400 hover:text-white transition"
            >
              <i class="fa-regular fa-eye text-sm"></i>
            </button>
          </div>

          <div id="referralRow">
            <div class="ios-separator"></div>
            <div class="flex items-center px-4 py-3.5">
              <div class="w-6 text-center text-amber-400">
                <i class="fa-solid fa-ticket text-sm"></i>
              </div>
              <input 
                type="text" 
                id="shareCodeInput" 
                placeholder="Kode Undangan (Opsional)" 
                class="flex-1 bg-transparent text-sm text-amber-300 font-mono tracking-widest placeholder-neutral-500 focus:outline-none pl-3 uppercase"
              >
            </div>
          </div>

        </div>

        <div id="feedbackBox" class="hidden text-xs px-4 py-3 rounded-xl font-medium text-center transition"></div>

        <button 
          type="submit" 
          id="btnSubmit" 
          class="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:opacity-95 text-black font-semibold py-3.5 rounded-2xl text-[16px] tracking-tight shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <span id="btnText">Daftar Sekarang</span>
        </button>
      </form>

      <!-- Trust Indicator -->
      <div class="pt-2 text-center">
        <div class="flex items-center justify-center space-x-4 text-neutral-400 text-xs">
          <div class="flex items-center space-x-1.5">
            <i class="fa-solid fa-shield-halved text-[11px] text-amber-400"></i>
            <span>Enkripsi 256-Bit</span>
          </div>
          <span class="text-neutral-600">•</span>
          <div class="flex items-center space-x-1.5">
            <i class="fa-solid fa-fingerprint text-[11px] text-amber-400"></i>
            <span>Aman & Privat</span>
          </div>
        </div>
      </div>

    </main>

    <footer class="text-center px-5 pt-4">
      <p class="text-[11px] text-neutral-500">
        © 2026 Indoinvestma Technologies. All rights reserved.
      </p>
    </footer>

  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('shareCode') || urlParams.get('ref') || '';

    const tabRegister = document.getElementById('tabRegister');
    const tabLogin = document.getElementById('tabLogin');
    const referralRow = document.getElementById('referralRow');
    const badgeCode = document.getElementById('badgeCode');
    const shareCodeInput = document.getElementById('shareCodeInput');
    const phoneInput = document.getElementById('phoneInput');
    const passwordInput = document.getElementById('passwordInput');
    const togglePassword = document.getElementById('togglePassword');
    const authForm = document.getElementById('authForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const feedbackBox = document.getElementById('feedbackBox');

    let isRegisterMode = true;

    if (codeFromUrl) {
      shareCodeInput.value = codeFromUrl;
      badgeCode.textContent = codeFromUrl;
    } else {
      badgeCode.textContent = 'NON-REFERRAL';
      badgeCode.classList.replace('text-amber-300', 'text-neutral-500');
    }

    shareCodeInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase();
      badgeCode.textContent = val || 'NON-REFERRAL';
    });

    tabRegister.addEventListener('click', () => {
      if (isRegisterMode) return;
      isRegisterMode = true;
      tabRegister.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 bg-[#2c2c2e] text-white shadow-sm';
      tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 text-neutral-400';
      referralRow.classList.remove('hidden');
      btnText.textContent = 'Daftar Sekarang';
      feedbackBox.classList.add('hidden');
    });

    tabLogin.addEventListener('click', () => {
      if (!isRegisterMode) return;
      isRegisterMode = false;
      tabLogin.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 bg-[#2c2c2e] text-white shadow-sm';
      tabRegister.className = 'flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 text-neutral-400';
      referralRow.classList.add('hidden');
      btnText.textContent = 'Masuk ke Akun';
      feedbackBox.classList.add('hidden');
    });

    togglePassword.addEventListener('click', () => {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      togglePassword.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash text-sm"></i>' : '<i class="fa-regular fa-eye text-sm"></i>';
    });

    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedbackBox.classList.add('hidden');

      let rawPhone = phoneInput.value.trim();
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
      const fullPhone = '+62' + rawPhone;
      const password = passwordInput.value;
      const shareCode = shareCodeInput.value.trim();

      btnSubmit.disabled = true;
      btnSubmit.classList.add('opacity-70');
      btnText.textContent = 'Memproses...';

      const targetEndpoint = isRegisterMode ? '/api/register' : '/api/login';
      const payload = isRegisterMode 
        ? { phone: fullPhone, password, shareCode } 
        : { phone: fullPhone, password };

      try {
        const response = await fetch(targetEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Terjadi kesalahan sistem.');
        }

        feedbackBox.className = 'text-xs px-4 py-3 rounded-xl font-medium text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        feedbackBox.textContent = result.message;
        feedbackBox.classList.remove('hidden');

        if (isRegisterMode) {
          setTimeout(() => {
            tabLogin.click();
          }, 1500);
        } else {
          localStorage.setItem('indoinvestma_user', JSON.stringify(result.data));
          btnText.textContent = 'Akses Diberikan';
        }

      } catch (err) {
        feedbackBox.className = 'text-xs px-4 py-3 rounded-xl font-medium text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        feedbackBox.textContent = err.message;
        feedbackBox.classList.remove('hidden');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('opacity-70');
        if (btnText.textContent === 'Memproses...') {
          btnText.textContent = isRegisterMode ? 'Daftar Sekarang' : 'Masuk ke Akun';
        }
      }
    });
  </script>
</body>
</html>`;

app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(htmlContent);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Indoinvestma running at http://localhost:${PORT}`);
  });
}

module.exports = app;
