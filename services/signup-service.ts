/**
 * Signup Service
 * Handles user registration and signup operations
 */

import { BaseService } from './base-service';

export interface SignUpRequest {
  name: string;
  cnic: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  success: boolean;
  error?: string;
  user?: {
    uid: string;
    name: string;
    cnic: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class SignupService extends BaseService {
  /**
   * Register a new user
   * Uses Admin SDK via API route for secure user creation
   * 
   * @param userData - User registration data
   * @returns Promise with signup response
   */
  static async signUp(userData: SignUpRequest): Promise<SignUpResponse> {
    try {
      // Client-side validation
      const validation = this.validateSignUpData(userData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Call API endpoint
      const response = await this.fetchApi<SignUpResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return response;
    } catch (error: any) {
      console.error('Sign up service error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Validate signup data before sending to API
   */
  private static validateSignUpData(userData: SignUpRequest): {
    isValid: boolean;
    error?: string;
  } {
    // Validate name
    if (!userData.name?.trim()) {
      return { isValid: false, error: 'Full name is required' };
    }
    if (userData.name.trim().length < 3) {
      return { isValid: false, error: 'Name must be at least 3 characters' };
    }

    // Validate CNIC
    if (!userData.cnic) {
      return { isValid: false, error: 'CNIC is required' };
    }
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(userData.cnic)) {
      return { isValid: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' };
    }

    // Validate email
    if (!userData.email) {
      return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Validate password
    if (!userData.password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (userData.password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }

    return { isValid: true };
  }

  /**
   * Validate CNIC format only
   */
  static validateCNIC(cnic: string): { isValid: boolean; error?: string } {
    if (!cnic) {
      return { isValid: false, error: 'CNIC is required' };
    }
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(cnic)) {
      return { isValid: false, error: 'CNIC format should be XXXXX-XXXXXXX-X' };
    }
    return { isValid: true };
  }

  /**
   * Validate email format only
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true };
  }

  /**
   * Validate password strength only
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    // Add more password strength checks if needed
    return { isValid: true };
  }

  /**
   * Check password strength and return suggestions
   */
  static getPasswordStrength(password: string): {
    strength: 'weak' | 'medium' | 'strong';
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 6) {
      suggestions.push('Use at least 6 characters');
      return { strength: 'weak', suggestions };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score < 3) {
      strength = 'weak';
      if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters');
      if (!/[0-9]/.test(password)) suggestions.push('Add numbers');
      if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special characters');
    } else if (score < 5) {
      strength = 'medium';
      if (password.length < 12) suggestions.push('Use at least 12 characters for strong password');
    } else {
      strength = 'strong';
    }

    return { strength, suggestions };
  }
}

