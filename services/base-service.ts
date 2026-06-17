/**
 * Base Service Class
 * Provides common functionality for all service classes
 */

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

export class BaseService {
  /**
   * Generic fetch wrapper with error handling
   */
  protected static async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // For Next.js API routes, use relative paths (no baseUrl needed)
      const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      console.log(`Making API request to: ${url}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Invalid response format. Check server console for details.');
      }

      const data = await response.json();
      
      // Handle non-200 responses
      if (!response.ok && data.error) {
        throw new Error(data.error);
      }
      
      return data as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`API Timeout (${endpoint}): Request took too long`);
        throw new Error('Request timeout: The server is taking too long to respond');
      }
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Get stored authentication token
   */
  protected static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('idToken');
    }
    return null;
  }

  /**
   * Set authentication token
   */
  protected static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('idToken', token);
    }
  }

  /**
   * Remove authentication token
   */
  protected static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('idToken');
    }
  }

  /**
   * Get user data from localStorage
   */
  protected static getUserData<T>(): T | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr) as T;
        } catch (error) {
          console.error('Error parsing user data:', error);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Set user data in localStorage
   */
  protected static setUserData<T>(user: T): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  /**
   * Clear all stored data
   */
  protected static clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('customToken');
      localStorage.removeItem('user');
    }
  }
}

