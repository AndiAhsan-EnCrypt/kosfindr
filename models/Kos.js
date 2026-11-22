const db = require('../config/database');

class Kos {
  // Ambil semua kos aktif
  static async getAll(filters = {}) {
    let query = `
      SELECT k.*, u.name as owner_name, u.phone as owner_phone,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM kos k
      JOIN users u ON k.user_id = u.id
      LEFT JOIN reviews r ON k.id = r.kos_id
      WHERE k.status = 'active'
    `;
    const params = [];

    // Filter berdasarkan kota
    if (filters.city) {
      query += ' AND k.city LIKE ?';
      params.push(`%${filters.city}%`);
    }

    // Filter berdasarkan tipe
    if (filters.type) {
      query += ' AND k.type = ?';
      params.push(filters.type);
    }

    // Filter berdasarkan harga min
    if (filters.price_min) {
      query += ' AND k.price_monthly >= ?';
      params.push(parseInt(filters.price_min));
    }

    // Filter berdasarkan harga max
    if (filters.price_max) {
      query += ' AND k.price_monthly <= ?';
      params.push(parseInt(filters.price_max));
    }

    // Filter berdasarkan pencarian nama/alamat
    if (filters.search) {
      query += ' AND (k.name LIKE ? OR k.address LIKE ? OR k.city LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' GROUP BY k.id';

    // Sorting
    if (filters.sort === 'price_asc') {
      query += ' ORDER BY k.price_monthly ASC';
    } else if (filters.sort === 'price_desc') {
      query += ' ORDER BY k.price_monthly DESC';
    } else if (filters.sort === 'rating') {
      query += ' ORDER BY avg_rating DESC';
    } else {
      query += ' ORDER BY k.created_at DESC';
    }

    const [rows] = await db.query(query, params);
    return rows.map(row => ({
      ...row,
      facilities: typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      avg_rating: parseFloat(row.avg_rating).toFixed(1)
    }));
  }

  // Ambil kos terbaru
  static async getLatest(limit = 6) {
    const [rows] = await db.query(`
      SELECT k.*, u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM kos k
      JOIN users u ON k.user_id = u.id
      LEFT JOIN reviews r ON k.id = r.kos_id
      WHERE k.status = 'active'
      GROUP BY k.id
      ORDER BY k.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows.map(row => ({
      ...row,
      facilities: typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      avg_rating: parseFloat(row.avg_rating).toFixed(1)
    }));
  }

  // Ambil kos berdasarkan ID
  static async findById(id) {
    const [rows] = await db.query(`
      SELECT k.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM kos k
      JOIN users u ON k.user_id = u.id
      LEFT JOIN reviews r ON k.id = r.kos_id
      WHERE k.id = ?
      GROUP BY k.id
    `, [id]);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      facilities: typeof rows[0].facilities === 'string' ? JSON.parse(rows[0].facilities) : (rows[0].facilities || []),
      images: typeof rows[0].images === 'string' ? JSON.parse(rows[0].images) : (rows[0].images || []),
      avg_rating: parseFloat(rows[0].avg_rating).toFixed(1)
    };
  }

  // Buat kos baru
  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO kos (user_id, name, description, address, city, price_monthly, type, rooms_available, facilities, rules, images, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id, data.name, data.description, data.address, data.city,
        data.price_monthly, data.type, data.rooms_available || 0,
        JSON.stringify(data.facilities || []), data.rules || '',
        JSON.stringify(data.images || []), data.status || 'active'
      ]
    );
    return result.insertId;
  }

  // Update kos
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.address) { fields.push('address = ?'); values.push(data.address); }
    if (data.city) { fields.push('city = ?'); values.push(data.city); }
    if (data.price_monthly) { fields.push('price_monthly = ?'); values.push(data.price_monthly); }
    if (data.type) { fields.push('type = ?'); values.push(data.type); }
    if (data.rooms_available !== undefined) { fields.push('rooms_available = ?'); values.push(data.rooms_available); }
    if (data.facilities) { fields.push('facilities = ?'); values.push(JSON.stringify(data.facilities)); }
    if (data.rules !== undefined) { fields.push('rules = ?'); values.push(data.rules); }
    if (data.images) { fields.push('images = ?'); values.push(JSON.stringify(data.images)); }
    if (data.status) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(`UPDATE kos SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  // Hapus kos
  static async delete(id) {
    await db.query('DELETE FROM kos WHERE id = ?', [id]);
  }

  // Ambil kos milik user tertentu
  static async getByUserId(userId) {
    const [rows] = await db.query(`
      SELECT k.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM kos k
      LEFT JOIN reviews r ON k.id = r.kos_id
      WHERE k.user_id = ?
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `, [userId]);
    return rows.map(row => ({
      ...row,
      facilities: typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      avg_rating: parseFloat(row.avg_rating).toFixed(1)
    }));
  }

  // Statistik
  static async getStats() {
    const [kosCount] = await db.query('SELECT COUNT(*) as total FROM kos WHERE status = "active"');
    const [userCount] = await db.query('SELECT COUNT(*) as total FROM users');
    const [reviewCount] = await db.query('SELECT COUNT(*) as total FROM reviews');
    return {
      totalKos: kosCount[0].total,
      totalUsers: userCount[0].total,
      totalReviews: reviewCount[0].total
    };
  }

  // Semua kos (untuk admin)
  static async getAllAdmin() {
    const [rows] = await db.query(`
      SELECT k.*, u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as total_reviews
      FROM kos k
      JOIN users u ON k.user_id = u.id
      LEFT JOIN reviews r ON k.id = r.kos_id
      GROUP BY k.id
      ORDER BY k.created_at DESC
    `);
    return rows.map(row => ({
      ...row,
      facilities: typeof row.facilities === 'string' ? JSON.parse(row.facilities) : (row.facilities || []),
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      avg_rating: parseFloat(row.avg_rating).toFixed(1)
    }));
  }

  // Ambil daftar kota unik
  static async getCities() {
    const [rows] = await db.query('SELECT DISTINCT city FROM kos WHERE status = "active" ORDER BY city');
    return rows.map(r => r.city);
  }
}

module.exports = Kos;
