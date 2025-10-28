// Base44 API Client
const BASE_URL = process.env.REACT_APP_BASE44_API_URL || 'https://api.base44.com';

const base44 = {
  auth: {
    // Get current user information
    async me() {
      try {
        const token = localStorage.getItem('base44_token');
        if (!token) return null;

        const response = await fetch(`${BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },

    // Redirect to login page
    redirectToLogin(redirectUrl = '/') {
      const loginUrl = `${BASE_URL}/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;
      window.location.href = loginUrl;
    },

    // Login with credentials
    async login(email, password) {
      try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('base44_token', data.token);
        return data.user;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    // Logout
    logout() {
      localStorage.removeItem('base44_token');
      window.location.href = '/';
    },

    // Register new user
    async register(userData) {
      try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
  },

  // Add other API methods as needed
  api: {
    // Generic API call method
    async call(endpoint, options = {}) {
      const token = localStorage.getItem('base44_token');
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return response.json();
    },
  },
};

export { base44 };
