// assets/js/utils.js - 通用工具函数

// ===== 价格格式化 =====
export function formatPrice(price) {
  return `¥${parseFloat(price).toFixed(2)}`;
}

// ===== 日期格式化 =====
export function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ===== 相对时间格式化 =====
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 秒数差

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  
  return formatDate(dateString);
}

// ===== Toast 提示消息 =====
let toastTimeout;

export function showToast(message, type = 'info', duration = 3000) {
  // 移除已存在的 toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
    clearTimeout(toastTimeout);
  }

  // 创建 toast 元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);

  // 触发动画
  setTimeout(() => toast.classList.add('show'), 10);

  // 自动移除
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Toast 快捷方法
export function showSuccess(message, duration) {
  showToast(message, 'success', duration);
}

export function showError(message, duration) {
  showToast(message, 'error', duration);
}

export function showInfo(message, duration) {
  showToast(message, 'info', duration);
}

// ===== 确认对话框 =====
export function confirm(message, title = '确认') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p style="margin: 0; font-size: 15px; color: #666;">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-cancel">取消</button>
          <button class="btn btn-primary btn-confirm">确定</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 确定按钮
    overlay.querySelector('.btn-confirm').onclick = () => {
      overlay.remove();
      resolve(true);
    };

    // 取消按钮
    overlay.querySelector('.btn-cancel').onclick = () => {
      overlay.remove();
      resolve(false);
    };

    // 点击背景关闭
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
}

// ===== 加载指示器 =====
export function showLoading(message = '加载中...') {
  const loading = document.createElement('div');
  loading.id = 'globalLoading';
  loading.className = 'modal-overlay active';
  loading.innerHTML = `
    <div class="modal" style="text-align: center; padding: 40px;">
      <div class="loading" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
      <p style="margin: 0; color: #666;">${message}</p>
    </div>
  `;
  document.body.appendChild(loading);
}

export function hideLoading() {
  const loading = document.getElementById('globalLoading');
  if (loading) loading.remove();
}

// ===== 防抖函数 =====
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== 节流函数 =====
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ===== 订单状态转换 =====
export function getOrderStatusText(status) {
  const statusMap = {
    'unpaid': '未支付',
    'paid': '已支付',
    'shipped': '已发货',
    'delivered': '已送达',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

export function getOrderStatusClass(status) {
  return `order-status ${status}`;
}

// ===== 支付方式转换 =====
export function getPaymentMethodText(method) {
  const methodMap = {
    'credit_card': '信用卡',
    'debit_card': '借记卡',
    'paypal': 'PayPal',
    'alipay': '支付宝',
    'wechat': '微信支付'
  };
  return methodMap[method] || method;
}

// ===== 验证函数 =====
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidPhone(phone) {
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
}

// ===== 本地存储辅助 =====
export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('存储失败:', e);
    return false;
  }
}

export function getStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('读取失败:', e);
    return defaultValue;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('删除失败:', e);
    return false;
  }
}

// ===== 数组分页 =====
export function paginate(array, page = 1, pageSize = 10) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return {
    data: array.slice(startIndex, endIndex),
    total: array.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(array.length / pageSize)
  };
}

// ===== URL 参数获取 =====
export function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// ===== 图片加载失败处理 =====
export function handleImageError(event) {
  event.target.src = 'https://via.placeholder.com/300x300?text=图片加载失败';
}

// ===== 复制到剪贴板 =====
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('已复制到剪贴板');
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    showError('复制失败');
    return false;
  }
}

// ===== 滚动到顶部 =====
export function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

// ===== 数字格式化 =====
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ===== Toast 样式（需要添加到 CSS 中，或在此动态注入） =====
// 如果 CSS 文件中没有 toast 样式，可以在这里动态添加
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    .toast {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      opacity: 0;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: none;
    }
    .toast.show {
      opacity: 1;s
      transform: translateX(-50%) translateY(0);
    }
    .toast-success {
      background: #4caf50;
      color: #fff;
    }
    .toast-error {
      background: #ff5e62;
      color: #fff;
    }
    .toast-info {
      background: #ff6700;
      color: #fff;
    }
  `;
  document.head.appendChild(style);
}