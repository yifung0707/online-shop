// routes/history.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 获取用户浏览历史
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const [history] = await db.query(
      `SELECT 
        bh.history_id,
        bh.viewed_at,
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.image_url,
        p.stock_quantity,
        c.category_name
      FROM browsing_history bh
      JOIN products p ON bh.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE bh.user_id = ?
      ORDER BY bh.viewed_at DESC
      LIMIT ?`,
      [req.user.user_id, parseInt(limit)]
    );

    res.json(history);

  } catch (error) {
    console.error('获取浏览历史错误:', error);
    res.status(500).json({ error: '获取浏览历史失败' });
  }
});

// 添加浏览记录
router.post('/add', async (req, res) => {
  try {
    const { product_id } = req.body;

    // 检查产品是否存在
    const [products] = await db.query(
      'SELECT * FROM products WHERE product_id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    // 添加浏览记录
    await db.query(
      'INSERT INTO browsing_history (user_id, product_id) VALUES (?, ?)',
      [req.user.user_id, product_id]
    );

    // 记录日志
    await db.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [req.user.user_id, 'view_product', `浏览产品: ${products[0].product_name} (ID: ${product_id})`]
    );

    res.status(201).json({ message: '浏览记录已添加' });

  } catch (error) {
    console.error('添加浏览记录错误:', error);
    res.status(500).json({ error: '添加浏览记录失败' });
  }
});

// 清空浏览历史
router.delete('/clear', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM browsing_history WHERE user_id = ?',
      [req.user.user_id]
    );

    res.json({ message: '浏览历史已清空' });

  } catch (error) {
    console.error('清空浏览历史错误:', error);
    res.status(500).json({ error: '清空浏览历史失败' });
  }
});

// 删除单条浏览记录
router.delete('/:history_id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM browsing_history WHERE history_id = ? AND user_id = ?',
      [req.params.history_id, req.user.user_id]
    );

    res.json({ message: '浏览记录已删除' });

  } catch (error) {
    console.error('删除浏览记录错误:', error);
    res.status(500).json({ error: '删除浏览记录失败' });
  }
});

// 获取浏览统计（按产品分类）
router.get('/stats', async (req, res) => {
  try {
    // 最常浏览的产品
    const [topProducts] = await db.query(
      `SELECT 
        p.product_id,
        p.product_name,
        p.image_url,
        COUNT(*) as view_count
      FROM browsing_history bh
      JOIN products p ON bh.product_id = p.product_id
      WHERE bh.user_id = ?
      GROUP BY p.product_id
      ORDER BY view_count DESC
      LIMIT 10`,
      [req.user.user_id]
    );

    // 按分类统计浏览次数
    const [categoryStats] = await db.query(
      `SELECT 
        c.category_name,
        COUNT(*) as view_count
      FROM browsing_history bh
      JOIN products p ON bh.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE bh.user_id = ?
      GROUP BY c.category_id
      ORDER BY view_count DESC`,
      [req.user.user_id]
    );

    // 最近7天的浏览趋势
    const [weeklyTrend] = await db.query(
      `SELECT 
        DATE(viewed_at) as date,
        COUNT(*) as view_count
      FROM browsing_history
      WHERE user_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(viewed_at)
      ORDER BY date DESC`,
      [req.user.user_id]
    );

    res.json({
      top_products: topProducts,
      category_stats: categoryStats,
      weekly_trend: weeklyTrend
    });

  } catch (error) {
    console.error('获取浏览统计错误:', error);
    res.status(500).json({ error: '获取浏览统计失败' });
  }
});

module.exports = router;