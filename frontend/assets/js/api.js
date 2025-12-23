// assets/js/api.js
const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // GET 请求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  // POST 请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUT 请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // DELETE 请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// 检查登录状态
export function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/frontend/login.html';
    return false;
  }
  return true;
}

// 获取用户信息
export function getUserInfo() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    user: JSON.parse(localStorage.getItem('user') || '{}')
  };
}

// 登出
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  window.location.href = '/frontend/login.html';
}