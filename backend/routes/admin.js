// routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// 所有管理员路由都需要登录和管理员权限
router.use(authenticateToken);
router.use(authenticateAdmin);

// ==================== 产品管理 ====================

// 添加产品
router.post('/products', async (req, res) => {
  try {
    const { category_id, product_name, description, price, stock_quantity, image_url, is_featured } = req.body;

    const [result] = await db.query(
      `INSERT INTO products (category_id, product_name, description, price, stock_quantity, image_url, is_featured) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, product_name, description, price, stock_quantity, image_url, is_featured || false]
    );

    res.status(201).json({
      message: '产品添加成功',
      product_id: result.insertId
    });

  } catch (error) {
    console.error('添加产品错误:', error);
    res.status(500).json({ error: '添加产品失败' });
  }
});

// 更新产品
router.put('/products/:id', async (req, res) => {
  try {
    const { category_id, product_name, description, price, stock_quantity, image_url, is_featured } = req.body;

    await db.query(
      `UPDATE products 
       SET category_id = ?, product_name = ?, description = ?, price = ?, 
           stock_quantity = ?, image_url = ?, is_featured = ?
       WHERE product_id = ?`,
      [category_id, product_name, description, price, stock_quantity, image_url, is_featured, req.params.id]
    );

    res.json({ message: '产品更新成功' });

  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ error: '更新产品失败' });
  }
});

// 删除产品
router.delete('/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
    res.json({ message: '产品删除成功' });

  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ error: '删除产品失败' });
  }
});

// ==================== 订单管理 ====================

// 获取所有订单
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.username, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.user_id 
       ORDER BY o.created_at DESC`
    );

    res.json(orders);

  } catch (error) {
    console.error('获取订单错误:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 更新订单状态
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, req.params.id]
    );

    res.json({ message: '订单状态更新成功' });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

// ==================== 客户管理 ====================

// 获取所有客户
router.get('/customers', async (req, res) => {
  try {
    const [customers] = await db.query(
      `SELECT user_id, username, email, full_name, phone, role, created_at 
       FROM users 
       WHERE role = 'user'
       ORDER BY created_at DESC`
    );

    res.json(customers);

  } catch (error) {
    console.error('获取客户错误:', error);
    res.status(500).json({ error: '获取客户失败' });
  }
});

// 获取单个客户详情
router.get('/customers/:id', async (req, res) => {
  try {
    const [customers] = await db.query(
      'SELECT user_id, username, email, full_name, phone, created_at FROM users WHERE user_id = ?',
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: '客户不存在' });
    }

    // 获取客户订单统计
    const [orderStats] = await db.query(
      `SELECT COUNT(*) as total_orders, SUM(total_amount) as total_spent 
       FROM orders 
       WHERE user_id = ? AND status != 'cancelled'`,
      [req.params.id]
    );

    res.json({
      ...customers[0],
      stats: orderStats[0]
    });

  } catch (error) {
    console.error('获取客户详情错误:', error);
    res.status(500).json({ error: '获取客户详情失败' });
  }
});

// ==================== 客户日志 ====================

// 获取客户行为日志
router.get('/customer-logs', async (req, res) => {
  try {
    const { user_id, action_type, start_date, end_date } = req.query;
    
    let query = `
      SELECT cl.*, u.username 
      FROM customer_logs cl 
      LEFT JOIN users u ON cl.user_id = u.user_id 
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ' AND cl.user_id = ?';
      params.push(user_id);
    }

    if (action_type) {
      query += ' AND cl.action_type = ?';
      params.push(action_type);
    }

    if (start_date) {
      query += ' AND cl.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND cl.created_at <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY cl.created_at DESC LIMIT 500';

    const [logs] = await db.query(query, params);
    res.json(logs);

  } catch (error) {
    console.error('获取日志错误:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// ==================== 销售报表 ====================

// 获取销售统计
router.get('/sales-report', async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    // 总销售额
    let totalQuery = 'SELECT SUM(total_amount) as total_sales, COUNT(*) as total_orders FROM orders WHERE status != "cancelled"';
    const totalParams = [];

    if (start_date) {
      totalQuery += ' AND created_at >= ?';
      totalParams.push(start_date);
    }

    if (end_date) {
      totalQuery += ' AND created_at <= ?';
      totalParams.push(end_date);
    }

    const [totalStats] = await db.query(totalQuery, totalParams);

    // 按时间分组统计
    let groupFormat;
    if (group_by === 'month') {
      groupFormat = '%Y-%m';
    } else if (group_by === 'year') {
      groupFormat = '%Y';
    } else {
      groupFormat = '%Y-%m-%d';
    }

    let timeQuery = `
      SELECT 
        DATE_FORMAT(created_at, '${groupFormat}') as period,
        SUM(total_amount) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE status != 'cancelled'
    `;
    const timeParams = [];

    if (start_date) {
      timeQuery += ' AND created_at >= ?';
      timeParams.push(start_date);
    }

    if (end_date) {
      timeQuery += ' AND created_at <= ?';
      timeParams.push(end_date);
    }

    timeQuery += ' GROUP BY period ORDER BY period DESC';

    const [timeStats] = await db.query(timeQuery, timeParams);

    // 热销产品
    const [topProducts] = await db.query(
      `SELECT 
        p.product_id, p.product_name, 
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.product_id
      ORDER BY total_sold DESC
      LIMIT 10`
    );

    res.json({
      total: totalStats[0],
      timeline: timeStats,
      top_products: topProducts
    });

  } catch (error) {
    console.error('获取销售报表错误:', error);
    res.status(500).json({ error: '获取销售报表失败' });
  }
});

// ==================== 分类管理 ====================

// 添加分类
router.post('/categories', async (req, res) => {
  try {
    const { category_name, description } = req.body;

    const [result] = await db.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name, description]
    );

    res.status(201).json({
      message: '分类添加成功',
      category_id: result.insertId
    });

  } catch (error) {
    console.error('添加分类错误:', error);
    res.status(500).json({ error: '添加分类失败' });
  }
});

module.exports = router;