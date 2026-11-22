const db = require('../config/database');

class Favorite {
  // Toggle favorite (tambah/hapus)
  static async toggle(userId, kosId) {
    const existing = await this.find(userId, kosId);
    if (existing) {
      await db.query('DELETE FROM favorites WHERE user_id = ? AND kos_id = ?', [userId, kosId]);
      return false; // removed
    } else {
      await db.query('INSERT INTO favorites (user_id, kos_id) VALUES (?, ?)', [userId, kosId]);
      return true; // added
    }
  }

  // Cek apakah sudah difavoritkan
  static async find(userId, kosId) {
    const [rows] = await db.query(
      'SELECT * FROM favorites WHERE user_id = ? AND kos_id = ?',
      [userId, kosId]
    );
    return rows[0];
  }

  // Ambil semua favorit user
  static async getByUserId(userId) {
    const [rows] = await db.query(`
      SELECT k.*, u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM favorites f
      JOIN kos k ON f.kos_id = k.id
      JOIN users u ON k.user_id = u.id
      LEFT JOIN reviews r ON k.id = r.kos_id
      WHERE f.user_id = ?
      GROUP BY k.id
      ORDER BY f.created_at DESC
    `, [userId]);
    return rows.map(row => ({
      ...row,
      facilities: typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      avg_rating: parseFloat(row.avg_rating).toFixed(1)
    }));
  }
}

module.exports = Favorite;
