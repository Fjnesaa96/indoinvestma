const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database in-memory
const users = [];

// Endpoint API Registrasi
app.post('/api/register', (req, res) => {
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

  const existingUser = users.find((u) => u.phone === phone);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Nomor handphone sudah terdaftar.'
    });
  }

  const newUser = {
    id: users.length + 1,
    phone,
    shareCode: shareCode || null,
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);

  return res.status(201).json({
    success: true,
    message: 'Registrasi akun berhasil!',
    data: {
      id: newUser.id,
      phone: newUser.phone,
      shareCode: newUser.shareCode
    }
  });
});

// Frontend HTML Landing Page
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Indoinvestma - Program Kemitraan Resmi</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body class="text-slate-100 flex justify-center min-h-screen">
  <main class="w-full max-w-md bg-slate-900 min-h-screen flex flex-col shadow-2xl border-x border-slate-800">
    
    <div class="relative bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-6 rounded-b-[2.5rem] shadow-xl text-slate-950">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center font-black text-amber-400 text-lg border border-amber-300/40">
            IM
          </div>
          <div>
            <h1 class="text-lg font-black tracking-wider leading-none">INDOINVESTMA</h1>
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-900">Official Partnership</span>
          </div>
        </div>
        <span class="bg-slate-950/15 border border-slate-950/20 text-slate-950 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
          VIP Invite
        </span>
      </div>

      <div class="mt-4">
        <h2 class="text-2xl font-black leading-tight">Undangan Eksklusif Portofolio Mitra</h2>
        <p class="text-xs font-semibold mt-1 opacity-90">Daftarkan akun dan klaim akses portofolio aset Anda sekarang.</p>
      </div>
    </div>

    <div class="px-5 -mt-5">
      <div class="bg-slate-800/95 backdrop-blur border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <i class="fa-solid fa-ticket"></i>
          </div>
          <div>
            <p class="text-[11px] text-slate-400 font-medium">Kode Undangan Terverifikasi</p>
            <p id="badgeCode" class="text-sm font-bold text-amber-400 font-mono tracking-widest">-</p>
          </div>
        </div>
        <span class="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
          Valid
        </span>
      </div>
    </div>

    <div class="px-6 py-6 flex-1 flex flex-col justify-between">
      <form id="regForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Nomor Handphone</label>
          <div class="relative">
            <span class="absolute left-3.5 top-3.5 text-slate-400 text-sm font-semibold">+62</span>
            <input 
              type="tel" 
              id="phone" 
              placeholder="81234567890" 
              required
              class="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-14 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            >
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Kata Sandi Akun</label>
          <div class="relative">
            <input 
              type="password" 
              id="password" 
              placeholder="Minimal 6 karakter" 
              required
              class="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            >
            <button 
              type="button" 
              id="btnTogglePass" 
              class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 text-sm"
            >
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Kode Referral</label>
          <input 
            type="text" 
            id="shareCode" 
            placeholder="KODE REFERRAL" 
            class="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm text-amber-400 font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-500 transition uppercase"
          >
        </div>

        <div id="alertBox" class="hidden text-xs p-3 rounded-xl border font-medium"></div>

        <button 
          type="submit" 
          id="btnSubmit" 
          class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center space-x-2 transition active:scale-[0.98]"
        >
          <span>Daftar Sekarang</span>
          <i class="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </form>

      <div class="pt-6 border-t border-slate-800 mt-6 space-y-4 text-center">
        <div class="grid grid-cols-3 gap-2 text-slate-400 text-[11px]">
          <div class="flex flex-col items-center">
            <i class="fa-solid fa-lock text-amber-400 mb-1"></i>
            <span>Terenkripsi</span>
          </div>
          <div class="flex flex-col items-center">
            <i class="fa-solid fa-bolt text-amber-400 mb-1"></i>
            <span>Instan</span>
          </div>
          <div class="flex flex-col items-center">
            <i class="fa-solid fa-shield-halved text-amber-400 mb-1"></i>
            <span>Privasi Aman</span>
          </div>
        </div>
        <p class="text-[11px] text-slate-500">
          Sudah punya akun? <a href="#" class="text-amber-400 hover:underline">Masuk</a>
        </p>
      </div>
    </div>

  </main>

  <script>
    const params = new URLSearchParams(window.location.search);
    const code = params.get('shareCode') || params.get('ref') || '';

    const shareCodeInput = document.getElementById('shareCode');
    const badgeCode = document.getElementById('badgeCode');
    const regForm = document.getElementById('regForm');
    const alertBox = document.getElementById('alertBox');
    const btnSubmit = document.getElementById('btnSubmit');
    const passInput = document.getElementById('password');
    const btnTogglePass = document.getElementById('btnTogglePass');

    if (code) {
      shareCodeInput.value = code;
      badgeCode.textContent = code;
    } else {
      badgeCode.textContent = 'TIDAK ADA';
      badgeCode.classList.replace('text-amber-400', 'text-slate-500');
    }

    shareCodeInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toUpperCase();
      badgeCode.textContent = val || 'TIDAK ADA';
      if (val) {
        badgeCode.classList.replace('text-slate-500', 'text-amber-400');
      } else {
        badgeCode.classList.replace('text-amber-400', 'text-slate-500');
      }
    });

    btnTogglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      btnTogglePass.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });

    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox.classList.add('hidden');

      let rawPhone = document.getElementById('phone').value.trim();
      if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
      const fullPhone = '+62' + rawPhone;
      const password = passInput.value;
      const shareCode = shareCodeInput.value.trim();

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Memproses...</span>';

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, password, shareCode })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Registrasi gagal.');
        }

        alertBox.className = 'text-xs p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
        alertBox.textContent = data.message;
        alertBox.classList.remove('hidden');

        setTimeout(() => {
          regForm.reset();
          btnSubmit.innerHTML = '<span>Pendaftaran Berhasil</span>';
        }, 1200);

      } catch (err) {
        alertBox.className = 'text-xs p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300';
        alertBox.textContent = err.message;
        alertBox.classList.remove('hidden');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>Daftar Sekarang</span><i class="fa-solid fa-arrow-right text-xs"></i>';
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
