# KosFindr

Sistem Pencarian Kos Kolaboratif — UAS Pemrograman Web (Semester 3).

## Tech Stack
- Node.js + Express.js
- MySQL (mysql2)
- EJS (view engine)
- Bootstrap 5
- Multer (upload gambar)

## Cara Install
1. Install Node.js dan MySQL (XAMPP/Laragon).
2. Clone/copy project, lalu:
   ```bash
   npm install
   ```
3. Import database:
   ```bash
   mysql -u root < database/schema.sql
   ```
4. Buat file `.env` (opsional, ada default):
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=kos_finder
   SESSION_SECRET=kos-finder-secret-key
   ```
5. Jalankan:
   ```bash
   npm start
   # atau npm run dev
   ```
   Buka http://localhost:3000

## Akun Demo
- Admin: admin@kosfindr.com / admin123
- Pemilik: budi@email.com / pemilik123
- Mahasiswa: andi@email.com / mhs123

## Fitur
- Cari & filter kos (kota, tipe, harga, sort)
- Detail kos, review & rating
- Favorit
- Pemilik: tambah/edit/hapus kos + upload foto
- Admin: dashboard, kelola user/kos/review

## Struktur Folder
- `config/` konfigurasi DB
- `models/` model data
- `routes/` routing
- `views/` template EJS
- `public/` aset statis & upload
- `database/schema.sql` skema + seed data
