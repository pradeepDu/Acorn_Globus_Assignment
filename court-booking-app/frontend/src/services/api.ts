import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (email: string, name: string) =>
    api.post('/auth/send-otp', { email, name }),
  verifyOTP: (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Courts API
export const courtsAPI = {
  getAll: (params?: { type?: string; status?: string }) =>
    api.get('/courts', { params }),
  getById: (id: string) => api.get(`/courts/${id}`),
  getAvailability: (id: string, date: string) =>
    api.get(`/courts/${id}/availability`, { params: { date } }),
  create: (data: any) => api.post('/courts', data),
  update: (id: string, data: any) => api.put(`/courts/${id}`, data),
  delete: (id: string) => api.delete(`/courts/${id}`),
};

// Equipment API
export const equipmentAPI = {
  getAll: (params?: { type?: string; status?: string }) =>
    api.get('/equipment', { params }),
  getById: (id: string) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: string, data: any) => api.put(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

// Coaches API
export const coachesAPI = {
  getAll: (params?: { status?: string }) => api.get('/coaches', { params }),
  getById: (id: string) => api.get(`/coaches/${id}`),
  create: (data: any) => api.post('/coaches', data),
  update: (id: string, data: any) => api.put(`/coaches/${id}`, data),
  delete: (id: string) => api.delete(`/coaches/${id}`),
};

// Bookings API
export const bookingsAPI = {
  checkAvailability: (data: any) =>
    api.post('/bookings/check-availability', data),
  previewPrice: (data: any) => api.post('/bookings/preview-price', data),
  create: (data: any) => api.post('/bookings', data),
  getAll: (params?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
  cancel: (id: string) => api.put(`/bookings/${id}/cancel`),
};

// Pricing Rules API
export const pricingRulesAPI = {
  getAll: (params?: { active?: boolean }) => api.get('/pricing-rules', { params }),
  getById: (id: string) => api.get(`/pricing-rules/${id}`),
  create: (data: any) => api.post('/pricing-rules', data),
  update: (id: string, data: any) => api.put(`/pricing-rules/${id}`, data),
  toggle: (id: string) => api.put(`/pricing-rules/${id}/toggle`),
  delete: (id: string) => api.delete(`/pricing-rules/${id}`),
};

// Waitlist API
export const waitlistAPI = {
  join: (data: any) => api.post('/waitlist', data),
  getAll: (params?: { status?: string }) => api.get('/waitlist', { params }),
  leave: (id: string) => api.delete(`/waitlist/${id}`),
  notifyNext: (data: any) => api.post('/waitlist/notify-next', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllBookings: (params?: any) => api.get('/admin/bookings', { params }),
  getAllWaitlist: (params?: any) => api.get('/admin/waitlist', { params }),
  getAllUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),
  getRevenueReport: (params?: any) =>
    api.get('/admin/reports/revenue', { params }),
};
