const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory mock database
const users = [];

// Endpoint registrasi akun via link referral
app.post('/api/register', (req, res) => {
  const { phone, password, shareCode } = req.body;

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
    message: 'Registrasi berhasil!',
    data: {
      id: newUser.id,
      phone: newUser.phone,
      shareCode: newUser.shareCode
    }
  });
});

// Fallback route untuk halaman referral
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan server lokal jika dieksekusi langsung
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Indoinvestma running at http://localhost:${PORT}`);
  });
}

module.exports = app;
