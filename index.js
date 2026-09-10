const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database
const users = [];

// API Endpoint Registrasi
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
    message: 'Registrasi berhasil!',
    data: {
      id: newUser.id,
      phone: newUser.phone,
      shareCode: newUser.shareCode
    }
  });
});

// Route utama untuk menyajikan index.html
app.get('*', (req, res) => {
  const file = path.join(__dirname, 'index.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).send('File index.html tidak ditemukan.');
  }
});

// Listener untuk pengujian lokal
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
