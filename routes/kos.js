const express = require('express');
const router = express.Router();
const Kos = require('../models/Kos');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');
const { isAuthenticated, isPemilik } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config untuk upload gambar kos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads', 'kos')),
  filename: (req, file, cb) => {
    const uniqueName = `kos-${Date.now()}-${Math.round(Math.random() * 1E6)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Hanya file gambar (jpg, png, webp) yang diperbolehkan!'));
  }
});

// GET /kos - Daftar semua kos
router.get('/', async (req, res) => {
  try {
    const filters = {
      search: req.query.search || '',
      city: req.query.city || '',
      type: req.query.type || '',
      price_min: req.query.price_min || '',
      price_max: req.query.price_max || '',
      sort: req.query.sort || 'latest'
    };

    const allKos = await Kos.getAll(filters);
    const cities = await Kos.getCities();

    // Pagination
    const perPage = 9;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const total = allKos.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(page, totalPages);
    const kosList = allKos.slice((currentPage - 1) * perPage, currentPage * perPage);

    // Cek favorit user
    let userFavorites = [];
    if (req.session.user) {
      const favs = await Favorite.getByUserId(req.session.user.id);
      userFavorites = favs.map(f => f.id);
    }

    res.render('kos/index', {
      title: 'Cari Kos',
      kosList,
      filters,
      cities,
      userFavorites,
      pagination: { page: currentPage, totalPages, total, perPage }
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat data kos.');
    res.redirect('/');
  }
});

// GET /kos/create - Form tambah kos
router.get('/create', isPemilik, (req, res) => {
  res.render('kos/create', { title: 'Tambah Kos Baru' });
});

// POST /kos/create - Simpan kos baru
router.post('/create', isPemilik, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, address, city, price_monthly, type, rooms_available, facilities, rules } = req.body;

    if (!name || !city || !address || !price_monthly || !type) {
      req.flash('error', 'Nama, kota, alamat, harga, dan tipe kos wajib diisi.');
      return res.redirect('/kos/create');
    }

    const images = req.files ? req.files.map(f => f.filename) : [];
    const facilityList = facilities ? (Array.isArray(facilities) ? facilities : [facilities]) : [];

    await Kos.create({
      user_id: req.session.user.id,
      name,
      description,
      address,
      city,
      price_monthly: parseInt(price_monthly),
      type,
      rooms_available: parseInt(rooms_available) || 0,
      facilities: facilityList,
      rules,
      images,
      status: 'active'
    });

    req.flash('success', 'Kos berhasil ditambahkan!');
    res.redirect('/kos/my-listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menambahkan kos.');
    res.redirect('/kos/create');
  }
});

// GET /kos/my-listings - Kos milik saya
router.get('/my-listings', isPemilik, async (req, res) => {
  try {
    const kosList = await Kos.getByUserId(req.session.user.id);
    res.render('kos/my-listings', { title: 'Kos Saya', kosList });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat data.');
    res.redirect('/');
  }
});

// GET /kos/favorites - Kos favorit saya
router.get('/favorites', isAuthenticated, async (req, res) => {
  try {
    const kosList = await Favorite.getByUserId(req.session.user.id);
    res.render('kos/favorites', { title: 'Kos Favorit Saya', kosList });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat favorit.');
    res.redirect('/');
  }
});

// POST /kos/:id/favorite - Toggle favorit
router.post('/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const added = await Favorite.toggle(req.session.user.id, req.params.id);
    req.flash('success', added ? 'Ditambahkan ke favorit!' : 'Dihapus dari favorit.');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal mengubah favorit.');
    res.redirect('back');
  }
});

// GET /kos/:id - Detail kos
router.get('/:id', async (req, res) => {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos) {
      req.flash('error', 'Kos tidak ditemukan.');
      return res.redirect('/kos');
    }

    const reviews = await Review.getByKosId(req.params.id);

    // Cek apakah user sudah review
    let userReview = null;
    let isFavorited = false;
    if (req.session.user) {
      userReview = await Review.findByUserAndKos(req.session.user.id, req.params.id);
      const fav = await Favorite.find(req.session.user.id, req.params.id);
      isFavorited = !!fav;
    }

    res.render('kos/detail', {
      title: kos.name,
      kos,
      reviews,
      userReview,
      isFavorited
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat detail kos.');
    res.redirect('/kos');
  }
});

// GET /kos/:id/edit - Form edit kos
router.get('/:id/edit', isPemilik, async (req, res) => {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos) {
      req.flash('error', 'Kos tidak ditemukan.');
      return res.redirect('/kos/my-listings');
    }

    // Pastikan hanya pemilik yang bisa edit
    if (kos.user_id !== req.session.user.id && req.session.user.role !== 'admin') {
      req.flash('error', 'Anda tidak memiliki akses untuk mengedit kos ini.');
      return res.redirect('/kos/my-listings');
    }

    res.render('kos/edit', { title: 'Edit Kos', kos });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat data kos.');
    res.redirect('/kos/my-listings');
  }
});

// PUT /kos/:id - Update kos
router.put('/:id', isPemilik, upload.array('images', 5), async (req, res) => {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos || (kos.user_id !== req.session.user.id && req.session.user.role !== 'admin')) {
      req.flash('error', 'Akses ditolak.');
      return res.redirect('/kos/my-listings');
    }

    const { name, description, address, city, price_monthly, type, rooms_available, facilities, rules, status } = req.body;

    const facilityList = facilities ? (Array.isArray(facilities) ? facilities : [facilities]) : [];

    let images = kos.images;
    if (req.files && req.files.length > 0) {
      // Hapus foto lama
      if (Array.isArray(kos.images)) {
        kos.images.forEach(img => {
          if (img) {
            const oldPath = path.join(__dirname, '..', 'public', 'uploads', 'kos', img);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        });
      }
      images = req.files.map(f => f.filename);
    }

    await Kos.update(req.params.id, {
      name, description, address, city,
      price_monthly: parseInt(price_monthly),
      type,
      rooms_available: parseInt(rooms_available) || 0,
      facilities: facilityList,
      rules,
      images,
      status: status || 'active'
    });

    req.flash('success', 'Kos berhasil diperbarui!');
    res.redirect('/kos/my-listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memperbarui kos.');
    res.redirect(`/kos/${req.params.id}/edit`);
  }
});

// DELETE /kos/:id - Hapus kos
router.delete('/:id', isPemilik, async (req, res) => {
  try {
    const kos = await Kos.findById(req.params.id);
    if (!kos || (kos.user_id !== req.session.user.id && req.session.user.role !== 'admin')) {
      req.flash('error', 'Akses ditolak.');
      return res.redirect('/kos/my-listings');
    }

    // Hapus foto terkait
    if (kos.images && Array.isArray(kos.images)) {
      kos.images.forEach(img => {
        if (img) {
          const imgPath = path.join(__dirname, '..', 'public', 'uploads', 'kos', img);
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
      });
    }
    await Kos.delete(req.params.id);
    req.flash('success', 'Kos berhasil dihapus.');
    res.redirect('/kos/my-listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus kos.');
    res.redirect('/kos/my-listings');
  }
});

module.exports = router;
