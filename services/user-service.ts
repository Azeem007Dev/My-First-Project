/**
 * User Service
 * Handles all user-related API calls including profile management and updates
 */

import { BaseService, ApiResponse } from './base-service';

export interface UserProfile {
  uid: string;
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  registrationDate?: string;
  lastLogin?: string;
  votingHistory?: number;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GetProfileResponse extends ApiResponse {
  profile?: UserProfile;
}

export interface UpdateProfileResponse extends ApiResponse {
  profile?: UserProfile;
}

export interface ChangePasswordResponse extends ApiResponse {
  message?: string;
}

export class UserService extends BaseService {
  /**
   * Get current user's profile from API
   * 
   * @returns Promise with user profile data
   */
  static async getProfile(): Promise<GetProfileResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<GetProfileResponse>('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Update local storage with fresh data
      if (response.success && response.profile) {
        this.setUserData(response.profile);
      }

      return response;
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get profile',
      };
    }
  }

  /**
   * Update user profile information
   * 
   * @param updates - Profile fields to update
   * @returns Promise with updated profile
   */
  static async updateProfile(updates: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      // Validate updates
      const validation = this.validateProfileUpdates(updates);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<UpdateProfileResponse>('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      // Update local storage with updated data
      if (response.success && response.profile) {
        this.setUserData(response.profile);
      }

      return response;
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  }

  /**
   * Change user password
   * 
   * @param passwordData - Current and new password
   * @returns Promise with change password response
   */
  static async changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      // Validate password data
      const validation = this.validatePasswordChange(passwordData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<ChangePasswordResponse>('/api/user/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      return response;
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  }

  /**
   * Get user's voting history
   * 
   * @returns Promise with voting history
   */
  static async getVotingHistory(): Promise<ApiResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<ApiResponse>('/api/user/voting-history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Get voting history error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get voting history',
        data: [],
      };
    }
  }

  /**
   * Get current user from localStorage
   */
  static getCurrentUser(): UserProfile | null {
    return this.getUserData<UserProfile>();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Check if current user is admin
   */
  static isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin === true;
  }

  /**
   * Validate profile updates before sending to API
   */
  private static validateProfileUpdates(updates: UpdateProfileRequest): {
    isValid: boolean;
    error?: string;
  } {
    // Check if at least one field is being updated
    if (!updates.name && !updates.email) {
      return { isValid: false, error: 'No updates provided' };
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return { isValid: false, error: 'Name cannot be empty' };
      }
      if (updates.name.trim().length < 3) {
        return { isValid: false, error: 'Name must be at least 3 characters' };
      }
      if (updates.name.trim().length > 100) {
        return { isValid: false, error: 'Name must not exceed 100 characters' };
      }
      // Check for valid characters (letters, spaces, hyphens, apostrophes)
      if (!/^[a-zA-Z\s'-]+$/.test(updates.name.trim())) {
        return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
      }
    }

    // Validate email if provided
    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return { isValid: false, error: 'Invalid email format' };
      }
      if (updates.email.length > 255) {
        return { isValid: false, error: 'Email must not exceed 255 characters' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate password change request
   */
  private static validatePasswordChange(data: ChangePasswordRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (!data.currentPassword) {
      return { isValid: false, error: 'Current password is required' };
    }

    if (!data.newPassword) {
      return { isValid: false, error: 'New password is required' };
    }

    if (data.newPassword.length < 6) {
      return { isValid: false, error: 'New password must be at least 6 characters' };
    }

    if (data.newPassword.length > 128) {
      return { isValid: false, error: 'New password must not exceed 128 characters' };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }

    if (data.currentPassword === data.newPassword) {
      return { isValid: false, error: 'New password must be different from current password' };
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(data.newPassword);
    const hasLowerCase = /[a-z]/.test(data.newPassword);
    const hasNumber = /[0-9]/.test(data.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { 
        isValid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }

    return { isValid: true };
  }
}

