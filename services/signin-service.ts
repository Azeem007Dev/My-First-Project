/**
 * Signin Service
 * Handles user authentication and signin operations
 */

import { BaseService } from './base-service';

export interface SignInRequest {
  cnic?: string;
  email?: string;
  password: string;
}

export interface SignInResponse {
  success: boolean;
  error?: string;
  idToken?: string;
  refreshToken?: string;
  customToken?: string;
  user?: {
    uid: string;
    name: string;
    cnic: string;
    email: string;
    isAdmin: boolean;
  };
}

export interface VerifyTokenResponse {
  success: boolean;
  error?: string;
  claims?: any;
  user?: any;
}

export class SigninService extends BaseService {
  /**
   * Authenticate user with CNIC/Email and password
   * Uses Admin SDK via API route for CNIC-based authentication
   * 
   * @param credentials - User login credentials
   * @returns Promise with signin response
   */
  static async signIn(credentials: SignInRequest): Promise<SignInResponse> {
    try {
      // Validate credentials
      const validation = this.validateSignInData(credentials);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Call API endpoint
      const response = await this.fetchApi<SignInResponse>('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Store tokens if successful
      if (response.success) {
        this.storeAuthData(response);
      }

      return response;
    } catch (error: any) {
      console.error('Sign in service error:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed. Please try again.',
      };
    }
  }

  /**
   * Verify authentication token
   * 
   * @param idToken - Firebase ID token
   * @returns Promise with verification response
   */
  static async verifyToken(idToken?: string): Promise<VerifyTokenResponse> {
    try {
      const token = idToken || this.getToken();
      
      if (!token) {
        return { success: false, error: 'No token provided' };
      }

      const response = await this.fetchApi<VerifyTokenResponse>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ idToken: token }),
      });

      return response;
    } catch (error: any) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: error.message || 'Token verification failed',
      };
    }
  }

  /**
   * Sign out current user
   * Clears all authentication data from storage
   */
  static async signOut(): Promise<void> {
    try {
      this.clearStorage();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Get current authenticated user
   * Returns user data from localStorage
   */
  static getCurrentUser(): any {
    return this.getUserData();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if current user is admin
   */
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin === true;
  }

  /**
   * Validate signin data before sending to API
   */
  private static validateSignInData(credentials: SignInRequest): {
    isValid: boolean;
    error?: string;
  } {
    // Validate password
    if (!credentials.password) {
      return { isValid: false, error: 'Password is required' };
    }

    // Validate CNIC or email is provided
    if (!credentials.cnic && !credentials.email) {
      return { isValid: false, error: 'CNIC or Email is required' };
    }

    // Validate CNIC format if provided
    if (credentials.cnic) {
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      if (!cnicRegex.test(credentials.cnic)) {
        return { isValid: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' };
      }
    }

    // Validate email format if provided
    if (credentials.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        return { isValid: false, error: 'Invalid email format' };
      }
    }

    return { isValid: true };
  }

  /**
   * Store authentication data in localStorage
   */
  private static storeAuthData(response: SignInResponse): void {
    if (typeof window === 'undefined') return;

    if (response.idToken) {
      localStorage.setItem('idToken', response.idToken);
    }
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    if (response.customToken) {
      localStorage.setItem('customToken', response.customToken);
    }
    if (response.user) {
      this.setUserData(response.user);
    }
  }
}

