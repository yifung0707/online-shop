// assets/js/navigation.js
import { getUserInfo, logout } from './api.js';

// 用户导航菜单
const userNavItems = [
  { name: '主页', path: '/frontend/user/home.html', icon: '🏠' },
  { name: '产品', path: '/frontend/user/products.html', icon: '🛍️' },
  { name: '购物车', path: '/frontend/user/cart.html', icon: '🛒' },
  { name: '订单', path: '/frontend/user/orders.html', icon: '📦' },
  { name: '浏览历史', path: '/frontend/user/product-history.html', icon: '📋' },
  { name: '个人', path: '/frontend/user/profile.html', icon: '👤' }
];

// 管理员导航菜单
const adminNavItems = [
  { name: '仪表盘', path: '/frontend/admin/dashboard.html', icon: '📊' },
  { name: '产品管理', path: '/frontend/admin/manage-products.html', icon: '📦' },
  { name: '订单管理', path: '/frontend/admin/manage-orders.html', icon: '📋' },
  { name: '客户管理', path: '/frontend/admin/manage-customers.html', icon: '👥' },
  { name: '销售报表', path: '/frontend/admin/sales-report.html', icon: '📈' },
  { name: '客户日志', path: '/frontend/admin/customer-logs.html', icon: '📝' }
];

// 渲染导航栏
export function renderNavigation(role = 'user') {
  const userInfo = getUserInfo();
  const currentPath = window.location.pathname;
  const navItems = role === 'admin' ? adminNavItems : userNavItems;
  const isAdmin = role === 'admin';

  const navHTML = `
    <nav class="navbar ${isAdmin ? 'admin-navbar' : ''}">
      <div class="navbar-content">
        <a href="${isAdmin ? '/frontend/admin/dashboard.html' : '/frontend/user/home.html'}" class="navbar-brand">
          <span class="logo-icon">🛍️</span>
          <span>OnlineShop</span>
        </a>

        <button class="navbar-toggle" onclick="toggleMobileMenu()">
          ☰
        </button>

        <ul class="navbar-nav" id="navbarNav">
          ${navItems.map(item => `
            <li>
              <a href="${item.path}" class="nav-link ${currentPath.includes(item.path) ? 'active' : ''}">
                <span class="icon">${item.icon}</span>
                <span>${item.name}</span>
              </a>
            </li>
          `).join('')}
          
          <li class="navbar-user">
            <div class="user-info">
              <div class="user-avatar">${(userInfo.user.username || 'U')[0].toUpperCase()}</div>
              <span class="user-name">${userInfo.user.username || '用户'}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">
              退出登录
            </button>
          </li>
        </ul>
      </div>
    </nav>
  `;

  // 插入导航栏到页面顶部
  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

// 切换移动端菜单
window.toggleMobileMenu = function() {
  const nav = document.getElementById('navbarNav');
  nav.classList.toggle('active');
};

// 处理登出
window.handleLogout = function() {
  if (confirm('确定要退出登录吗？')) {
    logout();
  }
};

// 自动初始化导航栏
export function initNavigation() {
  const userInfo = getUserInfo();
  
  if (!userInfo.token) {
    // 未登录，跳转到登录页
    const publicPages = ['/frontend/index.html', '/frontend/login.html', '/frontend/register.html'];
    const currentPath = window.location.pathname;
    
    if (!publicPages.some(page => currentPath.includes(page))) {
      window.location.href = '/frontend/login.html';
    }
    return;
  }

  // 已登录，渲染导航栏
  renderNavigation(userInfo.role);
}

// 检查是否在移动端点击了导航链接，如果是则关闭菜单
document.addEventListener('click', (e) => {
  const nav = document.getElementById('navbarNav');
  const toggle = document.querySelector('.navbar-toggle');
  
  if (nav && e.target.closest('.nav-link') && window.innerWidth <= 968) {
    nav.classList.remove('active');
  }
  
  // 点击外部关闭菜单
  if (nav && toggle && !e.target.closest('.navbar-content') && window.innerWidth <= 968) {
    nav.classList.remove('active');
  }
});