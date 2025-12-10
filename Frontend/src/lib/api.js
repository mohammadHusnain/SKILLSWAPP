import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Flag to track if we're currently refreshing the token
let isRefreshing = false;
// Queue for failed requests waiting for token refresh
let failedQueue = [];

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/register/',
      '/auth/partial-register/',
      '/auth/complete-register/',
      '/auth/login/',
      '/auth/password/reset/',
      '/auth/password/reset/confirm/',
      '/auth/verify-email/',
      '/auth/resend-verification/',
      '/contact/',
      '/health/',
    ];
    
    // Check if the current request is a public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    // Only add token if NOT a public endpoint
    if (!isPublicEndpoint) {
      const token = isBrowser ? localStorage.getItem('access_token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Response interceptor for handling errors and automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data, config } = error.response;
      
      // If 401 and not already retried, attempt token refresh
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // Check if this is a refresh token request to avoid infinite loop
        if (originalRequest.url?.includes('/auth/token/refresh/')) {
          // Refresh token failed - clear auth and redirect to login
          console.error('Refresh token failed - redirecting to login');
          tokenManager.clearAuth();
          
          // Only redirect if we're in browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject({
            message: 'Session expired. Please login again.',
            status: 401,
            data: data,
            isAxiosError: true,
          });
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
        
        try {
          // Attempt to refresh the token
          const response = await axios.post('/api/auth/token/refresh/', {}, {
            baseURL: api.defaults.baseURL,
            withCredentials: true, // Important: Send cookies
          });
          
          const newToken = response.data.access_token;
          
          // Store the new token
          tokenManager.setToken(newToken);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processQueue(null, newToken);
          isRefreshing = false;
          
          // Retry the original request
          return axios(originalRequest);
        } catch (refreshError) {
          // Token refresh failed - clear auth and redirect to login
          console.error('Token refresh failed:', refreshError);
          isRefreshing = false;
          tokenManager.clearAuth();
          
          // Process queued requests with error
          processQueue(refreshError);
          
          // Only redirect if we're in browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject({
            message: 'Session expired. Please login again.',
            status: 401,
            isAxiosError: true,
          });
        }
      } else if (status === 403) {
        // Forbidden
        console.error('Access forbidden');
      } else if (status === 404) {
        // Not found
        console.error('Resource not found');
      } else if (status >= 500) {
        // Server error
        console.error('Server error:', data);
      }
      
      // Return the error with response data for form validation
      // Extract error message - check multiple possible locations
      let errorMessage = 'An error occurred';
      if (data?.error) {
        errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.detail) {
        errorMessage = data.detail;
      }
      
      return Promise.reject({
        message: errorMessage,
        status,
        data: data,
        isAxiosError: true,
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isAxiosError: true,
      });
    } else {
      // Other error
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        isAxiosError: true,
      });
    }
  }
);

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Token management helpers
export const tokenManager = {
  // Store access token
  setToken: (token) => {
    if (isBrowser) {
      localStorage.setItem('access_token', token);
    }
  },

  // Get access token
  getToken: () => {
    if (!isBrowser) return null;
    return localStorage.getItem('access_token');
  },

  // Remove access token
  removeToken: () => {
    if (isBrowser) {
      localStorage.removeItem('access_token');
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (!isBrowser) return false;
    return !!localStorage.getItem('access_token');
  },

  // Clear all auth data
  clearAuth: () => {
    if (isBrowser) {
      localStorage.removeItem('access_token');
      // Clear any other auth-related data if needed
    }
  }
};

// Auth API methods
export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save partial registration (Step 1)
  savePartialRegistration: async (userData) => {
    try {
      const response = await api.post('/auth/partial-register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Complete registration (Step 2)
  completeRegistration: async (userData) => {
    try {
      const response = await api.post('/auth/complete-register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send contact form
  sendContactForm: async (formData) => {
    try {
      const response = await api.post('/contact/', formData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh access token using refresh token cookie
  refreshToken: async () => {
    try {
      // Note: The refresh token is stored in HttpOnly cookie and sent automatically
      const response = await axios.post('/api/auth/token/refresh/', {}, {
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
        withCredentials: true,
      });
      
      if (response.data.access_token) {
        tokenManager.setToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/password/reset/', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Confirm password reset with token
  confirmPasswordReset: async (token, newPassword, newPasswordConfirm) => {
    try {
      const response = await api.post('/auth/password/reset/confirm/', {
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify email with token
  verifyEmail: async (token) => {
    try {
      const response = await api.post('/auth/verify-email/', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend verification email
  resendVerification: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification/', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

};

// Profile API methods
export const profileAPI = {
  // Get current user's profile
  getProfile: async () => {
    try {
      const response = await api.get('/profile/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update current user's profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile/update/', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search profiles by skills
  searchProfiles: async (skills, limit = 20) => {
    try {
      const response = await api.get(`/profile/search/?skills=${skills.join(',')}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Matching API methods
export const matchingAPI = {
  // Get matches for current user
  getMatches: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.min_score) queryParams.append('min_score', params.min_score);
      
      const response = await api.get(`/matches/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific match details
  getMatchDetail: async (userId) => {
    try {
      const response = await api.get(`/matches/${userId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Express interest in a match
  expressInterest: async (matchedUserId) => {
    try {
      console.log('API: Expressing interest, matchedUserId:', matchedUserId);
      const response = await api.post('/matches/interest/', {
        matched_user_id: matchedUserId
      });
      console.log('API: Express interest response:', response);
      return response.data;
    } catch (error) {
      console.error('API: Express interest error:', error);
      console.error('API: Error response:', error.response);
      throw error;
    }
  },

  // Get users who expressed interest in me
  getInterestedUsers: async () => {
    try {
      const response = await api.get('/matches/interested/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Respond to an interest request
  respondToInterest: async (requesterUserId, accept) => {
    try {
      const response = await api.post('/matches/respond/', {
        requester_user_id: requesterUserId,
        accept: accept
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Payment API methods
export const paymentAPI = {
  // Premium payment methods (one-time payment)
  createPremiumCheckout: async (successUrl, cancelUrl) => {
    const response = await api.post('/payments/premium/create-checkout/', {
      success_url: successUrl,
      cancel_url: cancelUrl
    });
    return response.data;
  },
  
  // Legacy method name for backwards compatibility
  createSubscriptionCheckout: async (successUrl, cancelUrl) => {
    return paymentAPI.createPremiumCheckout(successUrl, cancelUrl);
  },
  
  getSubscriptionStatus: async () => {
    const response = await api.get('/payments/subscription/status/');
    return response.data;
  },
  
  cancelSubscription: async (cancelImmediately = false) => {
    const response = await api.post('/payments/subscription/cancel/', {
      cancel_immediately: cancelImmediately
    });
    return response.data;
  },
  
  getCustomerPortalLink: async (returnUrl) => {
    const response = await api.post('/payments/subscription/portal/', {
      return_url: returnUrl
    });
    return response.data;
  },
  
  // Tip methods
  createTipCheckout: async (toUserId, amount, message, successUrl, cancelUrl) => {
    const response = await api.post('/payments/tip/create/', {
      to_user_id: toUserId,
      amount: amount,
      message: message,
      success_url: successUrl,
      cancel_url: cancelUrl
    });
    return response.data;
  },
  
  getTipHistory: async () => {
    const response = await api.get('/payments/tip/history/');
    return response.data;
  }
};

// Message API methods
export const messageAPI = {
  // Get users for starting chat
  getChatUsers: async () => {
    try {
      const response = await api.get('/messages/chat-users/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/messages/upload-file/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Session API methods
export const sessionsAPI = {
  // Create a new session
  createSession: async (sessionData) => {
    try {
      const response = await api.post('/sessions/create/', sessionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all sessions for current user
  getSessions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/sessions/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get teaching sessions
  getTeachingSessions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/sessions/teaching/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get learning sessions
  getLearningSessions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/sessions/learning/?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get session details
  getSessionDetail: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update session
  updateSession: async (sessionId, updateData) => {
    try {
      const response = await api.put(`/sessions/${sessionId}/update/`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Accept session request
  acceptSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/accept/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reject session request
  rejectSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/reject/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Complete session
  completeSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/complete/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel session
  cancelSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/cancel/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/sessions/${sessionId}/delete/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// tokenManager, authAPI, profileAPI, matchingAPI, paymentAPI, messageAPI, and sessionsAPI are already exported above as const exports
export { api };
export default api;
