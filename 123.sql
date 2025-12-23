-- ========================================
-- 在线购物网站数据库初始化脚本
-- 数据库名: shop
-- ========================================

USE shop;

-- 清空现有表（如果存在）
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS customer_logs;
DROP TABLE IF EXISTS browsing_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 1. 用户表
-- ========================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 2. 地址表
-- ========================================
CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'China',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 3. 产品分类表
-- ========================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 4. 产品表
-- ========================================
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 5. 购物车表
-- ========================================
CREATE TABLE cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 6. 订单表
-- ========================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('unpaid', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'unpaid',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 7. 订单明细表
-- ========================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 8. 支付记录表
-- ========================================
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'alipay', 'wechat') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 9. 浏览历史表
-- ========================================
CREATE TABLE browsing_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_user_viewed (user_id, viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 10. 客户行为日志表
-- ========================================
CREATE TABLE customer_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('login', 'logout', 'view_product', 'add_to_cart', 'purchase', 'search') NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 插入测试数据
-- ========================================

-- 插入用户 (密码都是 'password123' 的哈希值，实际使用时需要用 bcrypt)
INSERT INTO users (username, email, password, full_name, phone, role) VALUES
('admin', 'admin@shop.com', '$2b$10$rZ5w7qX8pN9mY3vL2kJ4eOzKjH6tF8sD9wE5rT6yU7iO8pL9mN0qR', '管理员', '13800138000', 'admin'),
('zhangsan', 'zhangsan@example.com', '$2b$10$rZ5w7qX8pN9mY3vL2kJ4eOzKjH6tF8sD9wE5rT6yU7iO8pL9mN0qR', '张三', '13900139000', 'user'),
('lisi', 'lisi@example.com', '$2b$10$rZ5w7qX8pN9mY3vL2kJ4eOzKjH6tF8sD9wE5rT6yU7iO8pL9mN0qR', '李四', '13700137000', 'user');

-- 插入分类
INSERT INTO categories (category_name, description) VALUES
('电子产品', '手机、电脑、相机等电子设备'),
('服装鞋包', '男装、女装、鞋子、箱包'),
('食品饮料', '零食、饮料、生鲜食品'),
('家居用品', '家具、装饰、日用品'),
('图书音像', '书籍、音乐、影视');

-- 插入产品
INSERT INTO products (category_id, product_name, description, price, stock_quantity, image_url, is_featured) VALUES
(1, 'iPhone 15 Pro', '最新款苹果手机，A17芯片，钛金属边框', 7999.00, 50, 'https://via.placeholder.com/300x300?text=iPhone+15', TRUE),
(1, 'MacBook Pro 14', 'M3芯片，16GB内存，512GB存储', 14999.00, 30, 'https://via.placeholder.com/300x300?text=MacBook', TRUE),
(1, 'AirPods Pro 2', '主动降噪无线耳机', 1899.00, 100, 'https://via.placeholder.com/300x300?text=AirPods', FALSE),
(2, '男士休闲外套', '春秋款，纯棉材质', 299.00, 200, 'https://via.placeholder.com/300x300?text=Jacket', FALSE),
(2, '运动鞋', '透气舒适，适合跑步', 499.00, 150, 'https://via.placeholder.com/300x300?text=Shoes', TRUE),
(3, '进口零食大礼包', '多种口味，全家分享', 128.00, 80, 'https://via.placeholder.com/300x300?text=Snacks', FALSE),
(3, '有机蔬菜套餐', '新鲜采摘，当日配送', 68.00, 60, 'https://via.placeholder.com/300x300?text=Vegetables', FALSE),
(4, '北欧风茶几', '实木材质，简约设计', 1299.00, 25, 'https://via.placeholder.com/300x300?text=Table', FALSE),
(4, '智能台灯', '护眼LED，可调节亮度', 199.00, 120, 'https://via.placeholder.com/300x300?text=Lamp', FALSE),
(5, '三体（全集）', '刘慈欣科幻巨作', 99.00, 200, 'https://via.placeholder.com/300x300?text=Books', TRUE);

-- 插入地址
INSERT INTO addresses (user_id, recipient_name, phone, address_line, city, state, postal_code, is_default) VALUES
(2, '张三', '13900139000', '朝阳区建国路88号', '北京', '北京市', '100000', TRUE),
(3, '李四', '13700137000', '浦东新区世纪大道100号', '上海', '上海市', '200000', TRUE);

-- 插入测试订单
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(2, 8498.00, 'paid', '北京市朝阳区建国路88号'),
(3, 598.00, 'shipped', '上海市浦东新区世纪大道100号');

-- 插入订单明细
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 7999.00),
(1, 3, 1, 1899.00),
(2, 5, 1, 499.00),
(2, 6, 1, 128.00);

-- 插入浏览历史
INSERT INTO browsing_history (user_id, product_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 5),
(3, 5), (3, 6), (3, 4);

-- 插入客户日志
INSERT INTO customer_logs (user_id, action_type, details, ip_address) VALUES
(2, 'login', '用户登录', '192.168.1.100'),
(2, 'view_product', '查看商品: iPhone 15 Pro', '192.168.1.100'),
(2, 'add_to_cart', '添加到购物车: iPhone 15 Pro', '192.168.1.100'),
(2, 'purchase', '完成订单: #1', '192.168.1.100'),
(3, 'login', '用户登录', '192.168.1.101'),usersuser_id
(3, 'view_product', '查看商品: 运动鞋', '192.168.1.101');

-- ========================================
-- 完成！
-- ========================================
SELECT '数据库初始化完成！' AS Status;
SELECT '测试账户:' AS Info;
SELECT 'admin / password123 (管理员)' AS Account;
SELECT 'zhangsan / password123 (用户)' AS Account;
SELECT 'lisi / password123 (用户)' AS Account;