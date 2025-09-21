/**
 * API Client for Travel Planner
 * Handles all HTTP requests with error handling and offline support
 */

import { CONFIG } from '../config.js';

class APIClient {
  constructor() {
    this.baseURL = CONFIG.API_BASE;
    this.timeout = 5000; // 5 second timeout
  }

  /**
   * Make HTTP request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`[API] 🌐 ${config.method} ${url}`);

      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(response.status, response.statusText, url);
      }

      const data = await response.json();
      console.log(`[API] ✅ ${config.method} ${url} - Success`);

      return data;
    } catch (error) {
      console.error(
        `[API] ❌ ${config.method} ${url} - Failed:`,
        error.message
      );

      if (error.name === 'AbortError') {
        throw new APIError(408, 'Request timeout', url);
      }

      if (error instanceof APIError) {
        throw error;
      }

      // Network error or other issue
      throw new APIError(0, 'Network error', url, error);
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   */
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   */
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   */
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Upload file
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Object} options - Request options
   */
  async upload(endpoint, formData, options = {}) {
    const config = {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...options.headers,
      },
    };

    // Remove Content-Type header for FormData
    delete config.headers['Content-Type'];

    return this.request(endpoint, config);
  }

  /**
   * Check if endpoint is reachable
   * @param {string} endpoint - API endpoint to check
   */
  async ping(endpoint = '/health') {
    try {
      await this.get(endpoint);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set request timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }

  /**
   * Get base URL
   */
  getBaseURL() {
    return this.baseURL;
  }

  /**
   * Set base URL
   * @param {string} baseURL - New base URL
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(status, statusText, url, originalError = null) {
    super(`API Error ${status}: ${statusText} (${url})`);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.originalError = originalError;
  }

  /**
   * Check if error is network-related
   */
  isNetworkError() {
    return this.status === 0 || this.status === 408;
  }

  /**
   * Check if error is server-related (5xx)
   */
  isServerError() {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if error is client-related (4xx)
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    if (this.isNetworkError()) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    if (this.status === 404) {
      return 'The requested resource was not found.';
    }

    if (this.status === 403) {
      return 'You do not have permission to access this resource.';
    }

    if (this.status === 401) {
      return 'Authentication required. Please log in.';
    }

    if (this.isServerError()) {
      return 'Server error. Please try again later.';
    }

    return this.message;
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export both the class and instance
export { APIClient, APIError, apiClient };
export default apiClient;
