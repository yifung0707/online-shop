// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 创建订单（从购物车）
router.post('/create', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { shipping_address } = req.body;

    // 获取购物车商品
    const [cartItems] = await connection.query(
      `SELECT c.*, p.price, p.stock_quantity 
       FROM cart c 
       JOIN products p ON c.product_id = p.product_id 
       WHERE c.user_id = ?`,
      [req.user.user_id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: '购物车为空' });
    }

    // 检查库存
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ error: `商品 ${item.product_id} 库存不足` });
      }
    }

    // 计算总价
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 创建订单
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
      [req.user.user_id, total, shipping_address, 'unpaid']
    );

    const orderId = orderResult.insertId;

    // 创建订单明细
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      // 减少库存
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 清空购物车
    await connection.query('DELETE FROM cart WHERE user_id = ?', [req.user.user_id]);

    // 记录日志
    await connection.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [req.user.user_id, 'purchase', `创建订单 #${orderId}`]
    );

    await connection.commit();

    res.status(201).json({
      message: '订单创建成功',
      order_id: orderId,
      total_amount: total
    });

  } catch (error) {
    await connection.rollback();
    console.error('创建订单错误:', error);
    res.status(500).json({ error: '创建订单失败' });
  } finally {
    connection.release();
  }
});

// 获取用户所有订单
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT * FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.user_id]
    );

    // 获取每个订单的商品详情
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT oi.*, p.product_name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.product_id 
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    res.json(orders);

  } catch (error) {
    console.error('获取订单错误:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

// 获取单个订单详情
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orders[0];

    // 获取订单商品
    const [items] = await db.query(
      `SELECT oi.*, p.product_name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.product_id 
       WHERE oi.order_id = ?`,
      [order.order_id]
    );

    order.items = items;

    res.json(order);

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

// 取消订单
router.put('/:id/cancel', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 检查订单状态
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '订单不存在' });
    }

    if (orders[0].status !== 'unpaid') {
      await connection.rollback();
      return res.status(400).json({ error: '只能取消未支付的订单' });
    }

    // 恢复库存
    const [items] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 更新订单状态
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['cancelled', req.params.id]
    );

    await connection.commit();

    res.json({ message: '订单已取消' });

  } catch (error) {
    await connection.rollback();
    console.error('取消订单错误:', error);
    res.status(500).json({ error: '取消订单失败' });
  } finally {
    connection.release();
  }
});

module.exports = router;