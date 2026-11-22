const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Cari user berdasarkan email
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Cari user berdasarkan ID
  static async findById(id) {
    const [rows] = await db.query('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  // Buat user baru
  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, data.phone || null, data.role || 'mahasiswa']
    );
    return result.insertId;
  }

  // Verifikasi password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update profil
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.avatar) { fields.push('avatar = ?'); values.push(data.avatar); }
    if (data.password) {
      const hashed = await bcrypt.hash(data.password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  // Ambil semua user (untuk admin)
  static async getAll() {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  // Hapus user
  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  }

  // Hitung total user
  static async count() {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
  }
}

module.exports = User;
