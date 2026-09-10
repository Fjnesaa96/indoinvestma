module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan.'
    });
  }

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

  return res.status(201).json({
    success: true,
    message: 'Registrasi akun mitra berhasil!',
    data: {
      id: Date.now(),
      phone,
      shareCode: shareCode || null,
      registeredAt: new Date().toISOString()
    }
  });
};
