// Middleware Autentikasi

module.exports = {
  // Harus login
  isAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash('error', 'Silakan login terlebih dahulu.');
    res.redirect('/login');
  },

  // Harus belum login (untuk halaman login/register)
  isGuest: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    res.redirect('/');
  },

  // Harus admin
  isAdmin: (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    req.flash('error', 'Akses ditolak. Hanya admin yang bisa mengakses halaman ini.');
    res.redirect('/');
  },

  // Harus pemilik kos
  isPemilik: (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'pemilik' || req.session.user.role === 'admin')) {
      return next();
    }
    req.flash('error', 'Akses ditolak. Hanya pemilik kos yang bisa mengakses halaman ini.');
    res.redirect('/');
  },

  // Harus mahasiswa
  isMahasiswa: (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'mahasiswa' || req.session.user.role === 'admin')) {
      return next();
    }
    req.flash('error', 'Akses ditolak.');
    res.redirect('/');
  }
};
