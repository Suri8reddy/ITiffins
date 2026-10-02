const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Helper to get auth header
const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('tiffin_auth_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Generic fetch wrapper with error handling
async function handleResponse(response) {
  if (response.status === 204) {
    return { success: true };
  }
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    const errorMsg = data.error || data.detail || (typeof data === 'object' ? JSON.stringify(data) : 'An error occurred');
    throw new Error(errorMsg);
  }
  
  return data;
}

export const api = {
  // Authentication
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.warn("Logout error:", e);
    }
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Food Categories
  getCategories: async (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/menu/categories/${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createCategory: async (categoryData) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return handleResponse(res);
  },

  updateCategory: async (id, categoryData) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    return handleResponse(res);
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_BASE_URL}/menu/categories/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Food Items
  getFoodItems: async ({ category = '', availableOnly = false, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (availableOnly) params.append('available_only', 'true');
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/menu/items/${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createFoodItem: async (formData) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/menu/items/`, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? formData : JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  updateFoodItem: async (id, formData) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/menu/items/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? formData : JSON.stringify(formData)
    });
    return handleResponse(res);
  },

  toggleItemAvailability: async (id) => {
    const res = await fetch(`${API_BASE_URL}/menu/items/${id}/toggle_availability/`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  deleteFoodItem: async (id) => {
    const res = await fetch(`${API_BASE_URL}/menu/items/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Orders
  getOrders: async ({ payment_status = '', date = '', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (payment_status) params.append('payment_status', payment_status);
    if (date) params.append('date', date);
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/orders/${queryString}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getOrderDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse(res);
  },

  // Payments
  processPayment: async (paymentData) => {
    const res = await fetch(`${API_BASE_URL}/payments/process/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  // Reports & Analytics (Manager only)
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE_URL}/reports/dashboard-stats/`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getDailySalesReport: async (date = '') => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE_URL}/reports/daily-sales/${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getWeeklySalesReport: async (date = '') => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE_URL}/reports/weekly-sales/${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getMonthlySalesReport: async (year = '', month = '') => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/reports/monthly-sales/${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
