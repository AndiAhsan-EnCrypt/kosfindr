const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { isAuthenticated } = require('../middleware/auth');

// POST /review/:kosId - Tambah review
router.post('/:kosId', isAuthenticated, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const kosId = req.params.kosId;

    // Cek apakah sudah pernah review
    const existing = await Review.findByUserAndKos(req.session.user.id, kosId);
    if (existing) {
      req.flash('error', 'Anda sudah memberikan review untuk kos ini.');
      return res.redirect(`/kos/${kosId}`);
    }

    if (!rating || rating < 1 || rating > 5) {
      req.flash('error', 'Rating harus antara 1-5.');
      return res.redirect(`/kos/${kosId}`);
    }

    await Review.create({
      user_id: req.session.user.id,
      kos_id: kosId,
      rating: parseInt(rating),
      comment: comment || ''
    });

    req.flash('success', 'Review berhasil ditambahkan!');
    res.redirect(`/kos/${kosId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menambahkan review.');
    res.redirect(`/kos/${req.params.kosId}`);
  }
});

// PUT /review/:id - Update review
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.user_id !== req.session.user.id) {
      req.flash('error', 'Akses ditolak.');
      return res.redirect('back');
    }

    const { rating, comment } = req.body;
    await Review.update(req.params.id, {
      rating: parseInt(rating),
      comment: comment || ''
    });

    req.flash('success', 'Review berhasil diperbarui!');
    res.redirect(`/kos/${review.kos_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal memperbarui review.');
    res.redirect('back');
  }
});

// DELETE /review/:id - Hapus review
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || (review.user_id !== req.session.user.id && req.session.user.role !== 'admin')) {
      req.flash('error', 'Akses ditolak.');
      return res.redirect('back');
    }

    const kosId = review.kos_id;
    await Review.delete(req.params.id);

    req.flash('success', 'Review berhasil dihapus.');
    res.redirect(`/kos/${kosId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Gagal menghapus review.');
    res.redirect('back');
  }
});

module.exports = router;
