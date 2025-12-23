// reset-password.js
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPasswords() {
  try {
    // 连接数据库
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'YiF_150244',
      database: process.env.DB_NAME || 'shop'
    });

    console.log('✅ 数据库连接成功');

    // 生成密码哈希
    const password = 'password123';
    console.log('🔐 正在生成密码哈希...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 生成的密码哈希:', hashedPassword);
    console.log('🔐 哈希长度:', hashedPassword.length);

    // 更新所有测试账户的密码
    const [result] = await connection.query(
      `UPDATE users 
       SET password = ? 
       WHERE username IN ('admin', 'zhangsan', 'lisi')`,
      [hashedPassword]
    );

    console.log(`✅ 已更新 ${result.affectedRows} 个账户的密码`);

    // 验证更新是否成功
    const [users] = await connection.query(
      `SELECT username, password, role 
       FROM users 
       WHERE username IN ('admin', 'zhangsan', 'lisi')`
    );

    console.log('\n📋 更新后的账户：');
    for (const user of users) {
      console.log(`  - ${user.username} (${user.role}): ${user.password.substring(0, 30)}...`);
      
      // 验证密码是否正确
      const isValid = await bcrypt.compare('password123', user.password);
      console.log(`    验证结果: ${isValid ? '✅ 正确' : '❌ 错误'}`);
    }

    console.log('\n✅ 所有测试账户密码已重置为: password123');
    console.log('\n可以使用以下账户登录：');
    console.log('👤 管理员: admin / password123');
    console.log('👤 用户1: zhangsan / password123');
    console.log('👤 用户2: lisi / password123');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

resetPasswords();