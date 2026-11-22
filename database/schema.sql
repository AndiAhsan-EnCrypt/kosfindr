-- ============================================
-- KosFindr - Database Schema
-- Sistem Pencarian Kos Kolaboratif
-- ============================================

CREATE DATABASE IF NOT EXISTS kos_finder;
USE kos_finder;

-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('mahasiswa', 'pemilik', 'admin') DEFAULT 'mahasiswa',
  avatar VARCHAR(255) DEFAULT 'default-avatar.png',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Kos
CREATE TABLE IF NOT EXISTS kos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  price_monthly INT NOT NULL,
  type ENUM('putra', 'putri', 'campur') DEFAULT 'campur',
  rooms_available INT DEFAULT 0,
  facilities JSON,
  rules TEXT,
  images JSON,
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kos_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kos_id) REFERENCES kos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (user_id, kos_id)
);

-- Tabel Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kos_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (kos_id) REFERENCES kos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, kos_id)
);

-- ============================================
-- Seed Data
-- ============================================

-- Admin account (password: admin123)
INSERT INTO users (name, email, password, phone, role) VALUES
('Admin KosFindr', 'admin@kosfindr.com', '$2a$10$5N1Xr0tFmJI1WOakyJqGde5kxQRROmwdhoolUFCWbYz50r.XKizg2', '081234567890', 'admin');

-- Contoh Pemilik Kos (password: pemilik123)
INSERT INTO users (name, email, password, phone, role) VALUES
('Budi Santoso', 'budi@email.com', '$2a$10$8atMM3rN.JfcAjUYEzUdhuBuyspyV.OFjnYUxaZfvZbGRacQ2dGny', '081298765432', 'pemilik'),
('Ibu Sari', 'sari@email.com', '$2a$10$8atMM3rN.JfcAjUYEzUdhuBuyspyV.OFjnYUxaZfvZbGRacQ2dGny', '081355544433', 'pemilik');

-- Contoh Mahasiswa (password: mhs123)
INSERT INTO users (name, email, password, phone, role) VALUES
('Andi Pratama', 'andi@email.com', '$2a$10$L/3WCBWUMbZ23HsfCoGYj.13UeGmH0U2/NbtLW8WQP5hdCUbhvYKO', '081200112233', 'mahasiswa'),
('Siti Rahma', 'siti@email.com', '$2a$10$L/3WCBWUMbZ23HsfCoGYj.13UeGmH0U2/NbtLW8WQP5hdCUbhvYKO', '081344556677', 'mahasiswa');

-- Contoh Data Kos
INSERT INTO kos (user_id, name, description, address, city, price_monthly, type, rooms_available, facilities, rules, images, status) VALUES
(2, 'Kos Putra Sejahtera', 'Kos nyaman dekat kampus dengan fasilitas lengkap. Lingkungan aman dan tenang, cocok untuk mahasiswa yang ingin fokus belajar.', 'Jl. Pendidikan No. 15', 'Yogyakarta', 850000, 'putra', 5, '["WiFi", "AC", "Kamar Mandi Dalam", "Parkir Motor", "Dapur Bersama"]', 'Tidak boleh membawa hewan peliharaan. Tamu lawan jenis hanya di ruang tamu. Jam malam pukul 23.00.', '["kos1a.jpg", "kos1b.jpg"]', 'active'),
(2, 'Kos Putri Melati', 'Kos khusus putri dengan keamanan 24 jam. Dekat dengan pusat perbelanjaan dan kampus utama.', 'Jl. Melati Indah No. 8', 'Yogyakarta', 1200000, 'putri', 3, '["WiFi", "AC", "Kamar Mandi Dalam", "Laundry", "CCTV", "Parkir Motor"]', 'Khusus putri. Jam malam pukul 22.00. Wajib lapor jika pulang malam.', '["kos2a.jpg"]', 'active'),
(3, 'Kos Campur Harmoni', 'Kos modern dengan desain minimalis. Cocok untuk mahasiswa dan pekerja muda.', 'Jl. Harmoni Raya No. 22', 'Bandung', 950000, 'campur', 8, '["WiFi", "Kamar Mandi Dalam", "Parkir Motor", "Parkir Mobil", "Dapur Bersama", "Ruang Tamu"]', 'Jaga kebersihan bersama. Buang sampah pada tempatnya.', '["kos3a.jpg", "kos3b.jpg"]', 'active'),
(3, 'Kos Exclusive Mentari', 'Kos premium dengan fasilitas hotel. Full furnished dan siap huni.', 'Jl. Mentari No. 5', 'Bandung', 2500000, 'campur', 2, '["WiFi", "AC", "Kamar Mandi Dalam", "TV", "Kulkas", "Laundry", "Cleaning Service", "CCTV"]', 'Deposit 1 bulan. Minimum sewa 6 bulan.', '["kos4a.jpg"]', 'active'),
(2, 'Kos Putra Merdeka', 'Kos murah meriah dekat kampus. Cocok untuk mahasiswa hemat.', 'Jl. Merdeka No. 10', 'Surabaya', 500000, 'putra', 10, '["WiFi", "Kamar Mandi Luar", "Parkir Motor"]', 'Hemat listrik dan air.', '["kos5a.jpg"]', 'active'),
(3, 'Kos Putri Dahlia', 'Kos nyaman di area strategis dekat kampus dan pusat kota.', 'Jl. Dahlia No. 3', 'Malang', 750000, 'putri', 4, '["WiFi", "Kamar Mandi Dalam", "AC", "Parkir Motor", "Dapur Bersama"]', 'Khusus putri. Jaga ketenangan.', '["kos6a.jpg"]', 'active');

-- Contoh Reviews
INSERT INTO reviews (user_id, kos_id, rating, comment) VALUES
(4, 1, 5, 'Kos yang sangat nyaman! WiFi kencang dan pemiliknya ramah. Recommended!'),
(5, 1, 4, 'Bagus, tapi kadang air panas mati. Overall oke lah untuk harganya.'),
(4, 3, 4, 'Lokasi strategis dan bersih. Cuma parkir agak sempit.'),
(5, 2, 5, 'Keamanannya bagus, ada CCTV dan satpam. Cocok untuk putri.'),
(4, 4, 5, 'Worth it untuk harganya. Fasilitas lengkap banget!');

-- Contoh Favorites
INSERT INTO favorites (user_id, kos_id) VALUES
(4, 1),
(4, 3),
(5, 2),
(5, 4);

-- Kos tambahan

INSERT INTO kos (user_id, name, description, address, city, price_monthly, type, rooms_available, facilities, rules, images, status) VALUES
(2, 'Kos Putra Cendekia', 'Kos putra yang nyaman dan strategis, hanya 5 menit berjalan kaki dari kampus utama. Kamar luas dengan ventilasi baik, lingkungan tenang sehingga cocok untuk belajar. Pemilik ramah dan responsif, serta tersedia dapur bersama yang bersih. Cocok untuk mahasiswa yang mengutamakan kenyamanan dan akses mudah ke kampus.', 'Jl. Cendekia No. 12', 'Yogyakarta', 700000, 'putra', 6, '["WiFi", "AC", "Kamar Mandi Dalam", "Parkir Motor", "Dapur Bersama"]', 'Tidak boleh membawa hewan peliharaan. Jam malam pukul 23.00. Jaga kebersihan bersama.', '["kos7a.jpg"]', 'active'),
(3, 'Kos Putri Anggrek', 'Kos khusus putri dengan keamanan 24 jam dan akses kartu. Kamar fully furnished dengan kasur, lemari, dan meja belajar. Lokasi dekat pusat perbelanjaan dan halte bus, sangat memudahkan mobilitas. Lingkungan asri dan aman, ideal untuk mahasiswi yang mencari kenyamanan dan ketenangan.', 'Jl. Anggrek No. 7', 'Yogyakarta', 1100000, 'putri', 4, '["WiFi", "AC", "Kamar Mandi Dalam", "Laundry", "CCTV", "Parkir Motor"]', 'Khusus putri. Jam malam pukul 22.00. Wajib lapor jika pulang malam.', '["kos8a.jpg"]', 'active'),
(2, 'Kos Campur Niagara', 'Kos modern dengan desain minimalis dan fasilitas lengkap, cocok untuk mahasiswa maupun pekerja muda. Setiap kamar dilengkapi AC dan kamar mandi dalam, dengan area parkir yang luas. Lingkungan bersih dan terawat, serta dekat dengan berbagai tempat makan. Harga kompetitif untuk fasilitas yang ditawarkan.', 'Jl. Niagara Raya No. 18', 'Bandung', 1300000, 'campur', 7, '["WiFi", "AC", "Kamar Mandi Dalam", "Parkir Motor", "Parkir Mobil", "Dapur Bersama", "Ruang Tamu"]', 'Jaga kebersihan bersama. Buang sampah pada tempatnya. Tamu lawan jenis hanya di ruang tamu.', '["kos9a.jpg"]', 'active'),
(3, 'Kos Putra Merapi', 'Kos putra ekonomis dekat kampus dengan harga terjangkau untuk mahasiswa. Kamar sederhana namun bersih, dengan fasilitas dasar yang memadai. Lingkungan ramah dan aman, cocok untuk mahasiswa yang ingin menghemat biaya hidup. Pemilik fleksibel dan mudah diajak komunikasi.', 'Jl. Merapi No. 9', 'Surabaya', 600000, 'putra', 8, '["WiFi", "Kamar Mandi Luar", "Parkir Motor", "Dapur Bersama"]', 'Hemat listrik dan air. Jaga kebersihan kamar mandi bersama.', '["kos10a.jpg"]', 'active'),
(2, 'Kos Putri Kenanga', 'Kos putri nyaman di area strategis dekat kampus dan pusat kota Malang. Kamar dilengkapi AC dan kamar mandi dalam, dengan lingkungan yang tenang. Keamanan terjamin dengan CCTV dan akses terbatas. Cocok untuk mahasiswi yang menginginkan kenyamanan dan keamanan maksimal.', 'Jl. Kenanga No. 4', 'Malang', 800000, 'putri', 5, '["WiFi", "AC", "Kamar Mandi Dalam", "Parkir Motor", "Dapur Bersama", "CCTV"]', 'Khusus putri. Jam malam pukul 22.00. Jaga ketenangan.', '["kos11a.jpg"]', 'active'),
(3, 'Kos Campur Pelangi', 'Kos campur premium di Jakarta dengan fasilitas hotel dan lokasi strategis dekat transportasi publik. Kamar fully furnished dengan AC, TV, dan kamar mandi dalam. Tersedia cleaning service dan laundry, memudahkan penghuni yang sibuk. Ideal untuk mahasiswa dan pekerja yang menginginkan kenyamanan maksimal.', 'Jl. Pelangi No. 21', 'Jakarta', 1500000, 'campur', 3, '["WiFi", "AC", "Kamar Mandi Dalam", "TV", "Kulkas", "Laundry", "Cleaning Service", "CCTV", "Parkir Motor"]', 'Deposit 1 bulan. Minimum sewa 3 bulan. Jaga kebersihan bersama.', '["kos12a.jpg"]', 'active'),
(2, 'Kos Putra Bintang', 'Kos putra sederhana di Semarang dengan harga sangat terjangkau, cocok untuk mahasiswa baru. Fasilitas dasar tersedia, lingkungan aman dan ramah. Dekat dengan kampus dan warung makan, memudahkan kebutuhan sehari-hari. Pemilik sangat supportif dan mudah dihubungi.', 'Jl. Bintang No. 15', 'Semarang', 550000, 'putra', 9, '["WiFi", "Kamar Mandi Luar", "Parkir Motor"]', 'Hemat listrik dan air. Jaga kebersihan kamar mandi bersama.', '["kos13a.jpg"]', 'active'),
(3, 'Kos Putri Melur', 'Kos putri nyaman di Bali dengan suasana tenang dan sejuk, dekat kampus dan pantai. Kamar dilengkapi AC dan kamar mandi dalam, dengan lingkungan yang asri. Keamanan terjamin, cocok untuk mahasiswi yang mencari tempat tinggal jauh dari rumah. Pemilik ramah dan sigap.', 'Jl. Melur No. 6', 'Bali', 1250000, 'putri', 4, '["WiFi", "AC", "Kamar Mandi Dalam", "Laundry", "Parkir Motor", "Dapur Bersama"]', 'Khusus putri. Jam malam pukul 22.00. Jaga ketenangan dan kebersihan.', '["kos14a.jpg"]', 'active');
