require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// Security & performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());

// Rate limit untuk auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Terlalu banyak percobaan. Coba lagi nanti.'
});
app.use('/login', authLimiter);
app.use('/register', authLimiter);

// Pastikan folder upload tersedia
const fs = require('fs');
const uploadDirs = ['public/uploads', 'public/uploads/kos', 'public/uploads/avatars'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 hari
}));

// Flash messages
app.use(flash());

// Global variables untuk views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const kosRoutes = require('./routes/kos');
const reviewRoutes = require('./routes/review');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/kos', kosRoutes);
app.use('/review', reviewRoutes);
app.use('/admin', adminRoutes);

// Home
app.get('/', async (req, res) => {
  const Kos = require('./models/Kos');
  try {
    const latestKos = await Kos.getLatest(6);
    const stats = await Kos.getStats();
    res.render('home', { latestKos, stats });
  } catch (err) {
    console.error(err);
    res.render('home', { latestKos: [], stats: { totalKos: 0, totalUsers: 0, totalReviews: 0 } });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { 
    title: '404 - Halaman Tidak Ditemukan',
    message: 'Halaman yang kamu cari tidak ditemukan.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: 'Terjadi kesalahan pada server.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏠 KosFindr berjalan di http://localhost:${PORT}`);
});
