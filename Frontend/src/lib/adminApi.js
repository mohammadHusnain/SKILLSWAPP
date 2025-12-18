import axios from 'axios';

// Create axios instance with base configuration for Admin
const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Admin Token Manager - Uses separate keys for admin tokens
export const adminTokenManager = {
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_access_token', token);
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_access_token');
    }
    return null;
  },

  setRefreshToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_refresh_token', token);
    }
  },

  getRefreshToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_refresh_token');
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
    }
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('admin_access_token');
    }
    return false;
  }
};

// Flag to track if we're currently refreshing the token
let isRefreshing = false;
// Queue for failed requests waiting for token refresh
let failedQueue = [];

// Process queued failed requests after successful token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor for adding admin auth tokens
adminApi.interceptors.request.use(
  (config) => {
    const token = adminTokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 and automatic token refresh
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If there's no response, it's a network error - don't logout
    if (!error.response) {
      console.error('Admin API Network Error:', error.message);
      return Promise.reject(error);
    }

    const { status } = error.response;
    const requestUrl = originalRequest?.url || '';
    
    // If 401 and not already retried, attempt token refresh
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Don't try to refresh if this IS the login or refresh request
      if (requestUrl.includes('/admin/auth/login/') || requestUrl.includes('/admin/auth/refresh/')) {
        console.log('Login/refresh request failed, not attempting refresh');
        return Promise.reject(error);
      }

      // Prevent infinite refresh loops
      if (isRefreshing) {
        // Add request to queue to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = adminTokenManager.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('No refresh token available, logging out');
        isRefreshing = false;
        adminTokenManager.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        console.log('Attempting to refresh admin token...');
        const response = await axios.post(
          `${adminApi.defaults.baseURL}/admin/auth/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true }
        );

        const newAccessToken = response.data.access_token || response.data.access;
        
        // Store the new token
        adminTokenManager.setToken(newAccessToken);
        console.log('Admin token refreshed successfully');

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process queued requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - clear auth and redirect to login
        console.error('Admin token refresh failed:', refreshError);
        isRefreshing = false;
        adminTokenManager.removeToken();

        // Process queued requests with error
        processQueue(refreshError);

        // Only redirect if we're in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }

        return Promise.reject(refreshError);
      }
    }
    
    // If 403 Forbidden on non-login endpoint, log out
    if (status === 403 && !requestUrl.includes('/admin/auth/login/')) {
      console.warn('Admin access forbidden, logging out');
      adminTokenManager.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Admin API Methods
export const adminService = {
  // Admin Login
  login: async (email, password) => {
    try {
      console.log('Admin login attempt for:', email);
      const response = await adminApi.post('/admin/auth/login/', { email, password });
      console.log('Admin login response:', response.data);
      
      if (response.data.access_token || response.data.access) {
        const accessToken = response.data.access_token || response.data.access;
        const refreshToken = response.data.refresh_token || response.data.refresh;
        
        adminTokenManager.setToken(accessToken);
        if (refreshToken) {
          adminTokenManager.setRefreshToken(refreshToken);
          console.log('Admin tokens stored successfully (access + refresh)');
        } else {
          console.log('Admin access token stored (no refresh token)');
        }
        
        // Verify token was stored
        const storedToken = adminTokenManager.getToken();
        console.log('Verified stored token exists:', !!storedToken);
      } else {
        console.error('No access token in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get All Users
  getUsers: async (page = 1, pageSize = 10, status = '') => {
    try {
      const response = await adminApi.get('/admin/users/', {
        params: { page, page_size: pageSize, status }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get User Details
  getUserDetails: async (userId) => {
    try {
      const response = await adminApi.get(`/admin/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete User
  deleteUser: async (userId) => {
    try {
      const response = await adminApi.delete(`/admin/users/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update User/Profile
  updateUser: async (userId, data) => {
    try {
      const response = await adminApi.patch(`/admin/users/${userId}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get All Matches
  getMatches: async (page = 1, pageSize = 10) => {
    try {
      const response = await adminApi.get('/admin/matches/', {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  // Get Dashboard Stats
  getStats: async () => {
    try {
      const response = await adminApi.get('/admin/stats/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    adminTokenManager.removeToken();
  }
};

export default adminService;
