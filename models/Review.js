const db = require('../config/database');

class Review {
  // Ambil semua review untuk sebuah kos
  static async getByKosId(kosId) {
    const [rows] = await db.query(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.kos_id = ?
      ORDER BY r.created_at DESC
    `, [kosId]);
    return rows;
  }

  // Buat review baru
  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO reviews (user_id, kos_id, rating, comment) VALUES (?, ?, ?, ?)',
      [data.user_id, data.kos_id, data.rating, data.comment || '']
    );
    return result.insertId;
  }

  // Update review
  static async update(id, data) {
    await db.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [data.rating, data.comment, id]
    );
  }

  // Hapus review
  static async delete(id) {
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  }

  // Cek apakah user sudah review kos ini
  static async findByUserAndKos(userId, kosId) {
    const [rows] = await db.query(
      'SELECT * FROM reviews WHERE user_id = ? AND kos_id = ?',
      [userId, kosId]
    );
    return rows[0];
  }

  // Cari review berdasarkan ID
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
    return rows[0];
  }

  // Ambil semua review (admin)
  static async getAll() {
    const [rows] = await db.query(`
      SELECT r.*, u.name as user_name, k.name as kos_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN kos k ON r.kos_id = k.id
      ORDER BY r.created_at DESC
    `);
    return rows;
  }
}

module.exports = Review;
