// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 获取所有产品（支持搜索和分类筛选）
router.get('/', async (req, res) => {
  try {
    const { search, category_id, is_featured } = req.query;
    
    let query = `
      SELECT p.*, c.category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.category_id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND p.product_name LIKE ?';
      params.push(`%${search}%`);
    }

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (is_featured) {
      query += ' AND p.is_featured = 1';
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await db.query(query, params);
    res.json(products);

  } catch (error) {
    console.error('获取产品错误:', error);
    res.status(500).json({ error: '获取产品失败' });
  }
});

// 获取单个产品详情
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query(
      `SELECT p.*, c.category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.category_id 
       WHERE p.product_id = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    res.json(products[0]);

  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ error: '获取产品详情失败' });
  }
});

// 记录浏览历史（需要登录）
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO browsing_history (user_id, product_id) VALUES (?, ?)',
      [req.user.user_id, req.params.id]
    );

    await db.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [req.user.user_id, 'view_product', `查看产品 ID: ${req.params.id}`]
    );

    res.json({ message: '已记录浏览历史' });

  } catch (error) {
    console.error('记录浏览历史错误:', error);
    res.status(500).json({ error: '记录浏览历史失败' });
  }
});

// 获取所有分类
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY category_name');
    res.json(categories);

  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
});

module.exports = router;