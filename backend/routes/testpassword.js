// test-password.js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPassword() {
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'YiF_150244',
      database: 'shop'
    });

    // 获取 admin 用户
    const [users] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    const user = users[0];
    console.log('👤 用户信息:');
    console.log('  - 用户名:', user.username);
    console.log('  - 邮箱:', user.email);
    console.log('  - 角色:', user.role);
    console.log('  - 密码哈希:', user.password.substring(0, 30) + '...');
    console.log('  - 密码长度:', user.password.length);

    // 测试密码
    const testPasswords = ['password123', 'admin123', '123456'];
    
    console.log('\n🔐 测试密码验证:');
    for (const pwd of testPasswords) {
      const result = await bcrypt.compare(pwd, user.password);
      console.log(`  "${pwd}" => ${result ? '✅ 正确' : '❌ 错误'}`);
    }

    await connection.end();
  } catch (error) {
    console.error('错误:', error);
  }
}

testPassword();