// routes/payment.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 创建支付
router.post('/create', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { order_id, payment_method } = req.body;

    // 检查订单是否存在且属于当前用户
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [order_id, req.user.user_id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: '订单不存在' });
    }

    const order = orders[0];

    if (order.status !== 'unpaid') {
      await connection.rollback();
      return res.status(400).json({ error: '订单状态不正确' });
    }

    // 生成交易ID（实际应用中应该由支付网关提供）
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // 创建支付记录
    const [paymentResult] = await connection.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_id, paid_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [order_id, payment_method, order.total_amount, 'completed', transactionId]
    );

    // 更新订单状态为已支付
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['paid', order_id]
    );

    // 记录日志
    await connection.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [req.user.user_id, 'purchase', `完成支付，订单 #${order_id}，金额 ${order.total_amount}`]
    );

    await connection.commit();

    res.status(201).json({
      message: '支付成功',
      payment_id: paymentResult.insertId,
      transaction_id: transactionId,
      amount: order.total_amount
    });

  } catch (error) {
    await connection.rollback();
    console.error('支付错误:', error);
    res.status(500).json({ error: '支付失败' });
  } finally {
    connection.release();
  }
});

// 获取订单的支付记录
router.get('/order/:order_id', async (req, res) => {
  try {
    // 验证订单属于当前用户
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [req.params.order_id, req.user.user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: '订单不存在' });
    }

    // 获取支付记录
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [req.params.order_id]
    );

    res.json(payments);

  } catch (error) {
    console.error('获取支付记录错误:', error);
    res.status(500).json({ error: '获取支付记录失败' });
  }
});

// 获取用户所有支付记录
router.get('/history', async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, o.order_id 
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       WHERE o.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.user_id]
    );

    res.json(payments);

  } catch (error) {
    console.error('获取支付历史错误:', error);
    res.status(500).json({ error: '获取支付历史失败' });
  }
});

// 验证支付状态
router.get('/verify/:payment_id', async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, o.user_id 
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       WHERE p.payment_id = ?`,
      [req.params.payment_id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: '支付记录不存在' });
    }

    const payment = payments[0];

    // 验证支付记录属于当前用户
    if (payment.user_id !== req.user.user_id) {
      return res.status(403).json({ error: '无权访问此支付记录' });
    }

    res.json({
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      status: payment.status,
      amount: payment.amount,
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id,
      paid_at: payment.paid_at
    });

  } catch (error) {
    console.error('验证支付错误:', error);
    res.status(500).json({ error: '验证支付失败' });
  }
});

module.exports = router;