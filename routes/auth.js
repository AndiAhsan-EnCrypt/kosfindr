const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isGuest, isAuthenticated } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config untuk upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'avatars')),
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Hanya file gambar (jpg, png, webp) yang diperbolehkan!'));
  }
});

// GET /login
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// POST /login
router.post('/login', isGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      req.flash('error', 'Email atau password salah.');
      return res.redirect('/login');
    }

    const valid = await User.verifyPassword(password, user.password);
    if (!valid) {
      req.flash('error', 'Email atau password salah.');
      return res.redirect('/login');
    }

    // Simpan session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    req.flash('success', `Selamat datang, ${user.name}!`);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Terjadi kesalahan. Silakan coba lagi.');
    res.redirect('/login');
  }
});

// GET /register
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// POST /register
router.post('/register', isGuest, async (req, res) => {
  try {
    const { name, email, password, password_confirm, phone, role } = req.body;

    // Validasi
    if (!name || !email || !password) {
      req.flash('error', 'Nama, email, dan password wajib diisi.');
      return res.redirect('/register');
    }

    if (password !== password_confirm) {
      req.flash('error', 'Konfirmasi password tidak cocok.');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password minimal 6 karakter.');
      return res.redirect('/register');
    }

    // Cek email sudah terdaftar
    const existing = await User.findByEmail(email);
    if (existing) {
      req.flash('error', 'Email sudah terdaftar. Silakan gunakan email lain.');
      return res.redirect('/register');
    }

    // Buat user
    const userId = await User.create({
      name,
      email,
      password,
      phone,
      role: role === 'pemilik' ? 'pemilik' : 'mahasiswa'
    });

    // Auto login
    req.session.user = {
      id: userId,
      name,
      email,
      role: role === 'pemilik' ? 'pemilik' : 'mahasiswa',
      avatar: 'default-avatar.png'
    };

    req.flash('success', 'Registrasi berhasil! Selamat datang di KosFindr.');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Terjadi kesalahan. Silakan coba lagi.');
    res.redirect('/register');
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET /profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('profile', { title: 'Profil Saya', profileUser: user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat profil.');
    res.redirect('/');
  }
});

// POST /profile
router.post('/profile', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, phone, password, password_confirm } = req.body;
    const updateData = { name, email, phone };

    if (password) {
      if (password !== password_confirm) {
        req.flash('error', 'Konfirmasi password tidak cocok.');
        return res.redirect('/profile');
      }
      updateData.password = password;
    }

    if (req.file) {
      // Hapus avatar lama (kecuali default)
      const oldUser = await User.findById(req.session.user.id);
      if (oldUser && oldUser.avatar && oldUser.avatar !== 'default-avatar.png') {
        const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'avatars', oldUser.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.avatar = req.file.filename;
    }

    await User.update(req.session.user.id, updateData);

    // Update session
    req.session.user.name = name;
    req.session.user.email = email;
    if (req.file) req.session.user.avatar = req.file.filename;

    req.flash('success', 'Profil berhasil diperbarui.');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memperbarui profil.');
    res.redirect('/profile');
  }
});

module.exports = router;
