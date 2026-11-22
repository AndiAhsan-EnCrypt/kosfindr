const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Kos = require('../models/Kos');
const Review = require('../models/Review');
const { isAdmin } = require('../middleware/auth');

// GET /admin - Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    const kosList = await Kos.getAllAdmin();
    const reviews = await Review.getAll();
    const stats = await Kos.getStats();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      users,
      kosList,
      reviews,
      stats
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memuat dashboard.');
    res.redirect('/');
  }
});

// DELETE /admin/users/:id - Hapus user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.session.user.id) {
      req.flash('error', 'Tidak bisa menghapus akun sendiri.');
      return res.redirect('/admin');
    }
    await User.delete(req.params.id);
    req.flash('success', 'User berhasil dihapus.');
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus user.');
    res.redirect('/admin');
  }
});

// PUT /admin/kos/:id/status - Update status kos
router.put('/kos/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await Kos.update(req.params.id, { status });
    req.flash('success', 'Status kos berhasil diperbarui.');
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memperbarui status kos.');
    res.redirect('/admin');
  }
});

// DELETE /admin/kos/:id - Hapus kos
router.delete('/kos/:id', isAdmin, async (req, res) => {
  try {
    await Kos.delete(req.params.id);
    req.flash('success', 'Kos berhasil dihapus.');
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus kos.');
    res.redirect('/admin');
  }
});

// DELETE /admin/reviews/:id - Hapus review
router.delete('/reviews/:id', isAdmin, async (req, res) => {
  try {
    await Review.delete(req.params.id);
    req.flash('success', 'Review berhasil dihapus.');
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus review.');
    res.redirect('/admin');
  }
});

module.exports = router;
