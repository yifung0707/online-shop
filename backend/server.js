// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 导入路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const historyRoutes = require('./routes/history');  // ← 确认这行存在
const adminRoutes = require('./routes/admin');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/history', historyRoutes);  // ← 确认这行存在
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '在线购物网站 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      payment: '/api/payment',
      history: '/api/history',  // ← 确认这行存在
      admin: '/api/admin'
    }
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '路由不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║     🚀 服务器启动成功！                    ║
║                                           ║
║     端口: ${PORT}                          ║
║     环境: ${process.env.NODE_ENV}         ║
║                                           ║
║     API 地址: http://localhost:${PORT}   ║
║                                           ║
║     测试账户:                             ║
║     - admin / password123 (管理员)        ║
║     - zhangsan / password123 (用户)       ║
║     - lisi / password123 (用户)           ║
╚═══════════════════════════════════════════╝
  `);
});