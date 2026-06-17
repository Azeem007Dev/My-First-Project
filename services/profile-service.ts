/**
 * Profile Service
 * Handles user profile operations and updates
 */

import { BaseService } from './base-service';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileService extends BaseService {
  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      const { AuthService } = await import('@/lib/auth');
      
      return await AuthService.getUserProfile(uid);
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    uid: string,
    updates: UpdateProfileRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate updates
      const validation = this.validateProfileUpdates(updates);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const { DatabaseService } = await import('@/lib/database');
      
      const success = await DatabaseService.updateUserProfile(uid, updates);

      if (success) {
        // Update local user data
        const user = this.getUserData<UserProfile>();
        if (user) {
          this.setUserData({ ...user, ...updates });
        }
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update profile' };
      }
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
   * Note: This would typically need Firebase Auth integration
   */
  static async changePassword(
    passwordData: ChangePasswordRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate password data
      const validation = this.validatePasswordChange(passwordData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // TODO: Implement password change via Firebase Auth
      // This would require Firebase Auth re-authentication and update
      
      return {
        success: false,
        error: 'Password change not yet implemented',
      };
    } catch (error: any) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  }

  /**
   * Get voting history for current user
   */
  static async getVotingHistory(userId: string): Promise<any[]> {
    try {
      // This would query votes collection filtered by userId
      // Implementation depends on your database structure
      return [];
    } catch (error) {
      console.error('Get voting history error:', error);
      return [];
    }
  }

  /**
   * Validate profile updates
   */
  private static validateProfileUpdates(updates: UpdateProfileRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        return { isValid: false, error: 'Name cannot be empty' };
      }
      if (updates.name.trim().length < 3) {
        return { isValid: false, error: 'Name must be at least 3 characters' };
      }
    }

    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return { isValid: false, error: 'Invalid email format' };
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

    if (data.newPassword !== data.confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }

    if (data.currentPassword === data.newPassword) {
      return { isValid: false, error: 'New password must be different from current password' };
    }

    return { isValid: true };
  }
}

