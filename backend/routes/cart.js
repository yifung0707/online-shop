// routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 所有购物车路由都需要登录
router.use(authenticateToken);

// 获取用户购物车
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT c.*, p.product_name, p.price, p.image_url, p.stock_quantity,
              (c.quantity * p.price) as subtotal
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?`,
      [req.user.user_id]
    );

    const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      items,
      total: total.toFixed(2)
    });

  } catch (error) {
    console.error('获取购物车错误:', error);
    res.status(500).json({ error: '获取购物车失败' });
  }
});

// 添加商品到购物车
router.post('/add', async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    // 检查产品是否存在且有库存
    const [products] = await db.query(
      'SELECT * FROM products WHERE product_id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    if (products[0].stock_quantity < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    // 检查购物车中是否已有该商品
    const [existing] = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.user_id, product_id]
    );

    if (existing.length > 0) {
      // 更新数量
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.user.user_id, product_id]
      );
    } else {
      // 添加新商品
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.user_id, product_id, quantity]
      );
    }

    // 记录日志
    await db.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [req.user.user_id, 'add_to_cart', `添加产品到购物车: ${products[0].product_name}`]
    );

    res.json({ message: '已添加到购物车' });

  } catch (error) {
    console.error('添加购物车错误:', error);
    res.status(500).json({ error: '添加购物车失败' });
  }
});

// 更新购物车商品数量
router.put('/:cart_id', async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ error: '数量必须大于0' });
    }

    await db.query(
      'UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
      [quantity, req.params.cart_id, req.user.user_id]
    );

    res.json({ message: '购物车已更新' });

  } catch (error) {
    console.error('更新购物车错误:', error);
    res.status(500).json({ error: '更新购物车失败' });
  }
});

// 删除购物车商品
router.delete('/:cart_id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [req.params.cart_id, req.user.user_id]
    );

    res.json({ message: '已从购物车删除' });

  } catch (error) {
    console.error('删除购物车错误:', error);
    res.status(500).json({ error: '删除购物车失败' });
  }
});

// 清空购物车
router.delete('/', async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.user_id]);
    res.json({ message: '购物车已清空' });

  } catch (error) {
    console.error('清空购物车错误:', error);
    res.status(500).json({ error: '清空购物车失败' });
  }
});

module.exports = router;