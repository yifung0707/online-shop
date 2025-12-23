// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body;

    // 检查用户是否已存在
    const [existing] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, phone]
    );

    // 记录日志
    await db.query(
      'INSERT INTO customer_logs (user_id, action_type, details) VALUES (?, ?, ?)',
      [result.insertId, 'register', `新用户注册: ${username}`]
    );

    res.status(201).json({ 
      message: '注册成功',
      user_id: result.insertId 
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    console.log('👤 查询到的用户:', users.length > 0 ? users[0].username : '未找到');  // ← 添加这行
    console.log('🔐 数据库密码哈希:', users.length > 0 ? users[0].password.substring(0, 20) + '...' : '无');  // ← 添加这行

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = users[0];

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 记录登录日志
    await db.query(
      'INSERT INTO customer_logs (user_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
      [user.user_id, 'login', `用户登录: ${user.username}`, req.ip]
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;