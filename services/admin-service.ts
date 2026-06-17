/**
 * Admin Service
 * Handles administrative operations (user management, election management, etc.)
 */

import { BaseService } from './base-service';

export interface UserProfile {
  uid: string;
  name: string;
  cnic: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateElectionRequest {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  candidates: string[];
}

export interface CreateCandidateRequest {
  name: string;
  party: string;
  symbol: string;
  color: string;
  description: string;
}

export class AdminService extends BaseService {
  /**
   * Get all users (Admin only)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getAllUsers();
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  /**
   * Create a new election (Admin only)
   */
  static async createElection(electionData: CreateElectionRequest): Promise<{
    success: boolean;
    error?: string;
    electionId?: string;
  }> {
    try {
      // Validate election data
      const validation = this.validateElectionData(electionData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const { DatabaseService } = await import('@/lib/database');
      
      const electionId = await DatabaseService.createElection({
        ...electionData,
        status: 'upcoming' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (electionId) {
        return { success: true, electionId };
      } else {
        return { success: false, error: 'Failed to create election' };
      }
    } catch (error: any) {
      console.error('Create election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create election',
      };
    }
  }

  /**
   * Update election status (Admin only)
   */
  static async updateElectionStatus(
    electionId: string,
    status: 'upcoming' | 'active' | 'ended'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      
      const success = await DatabaseService.updateElection(electionId, { status });

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update election status' };
      }
    } catch (error: any) {
      console.error('Update election status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update election status',
      };
    }
  }

  /**
   * Create a new candidate (Admin only)
   */
  static async createCandidate(candidateData: CreateCandidateRequest): Promise<{
    success: boolean;
    error?: string;
    candidateId?: string;
  }> {
    try {
      // Validate candidate data
      const validation = this.validateCandidateData(candidateData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const { DatabaseService } = await import('@/lib/database');
      
      const candidateId = await DatabaseService.createCandidate(candidateData);

      if (candidateId) {
        return { success: true, candidateId };
      } else {
        return { success: false, error: 'Failed to create candidate' };
      }
    } catch (error: any) {
      console.error('Create candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create candidate',
      };
    }
  }

  /**
   * Update candidate information (Admin only)
   */
  static async updateCandidate(
    candidateId: string,
    updates: Partial<CreateCandidateRequest>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      
      const success = await DatabaseService.updateCandidate(candidateId, updates);

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update candidate' };
      }
    } catch (error: any) {
      console.error('Update candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update candidate',
      };
    }
  }

  /**
   * Delete candidate (Admin only)
   */
  static async deleteCandidate(candidateId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      
      const success = await DatabaseService.deleteCandidate(candidateId);

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to delete candidate' };
      }
    } catch (error: any) {
      console.error('Delete candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete candidate',
      };
    }
  }

  /**
   * Update user admin status (Admin only)
   */
  static async updateUserAdminStatus(
    userId: string,
    isAdmin: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      
      const success = await DatabaseService.updateUserProfile(userId, { isAdmin });

      if (success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update user admin status' };
      }
    } catch (error: any) {
      console.error('Update user admin status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update user admin status',
      };
    }
  }

  /**
   * Validate election data
   */
  private static validateElectionData(data: CreateElectionRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (!data.title?.trim()) {
      return { isValid: false, error: 'Election title is required' };
    }

    if (!data.description?.trim()) {
      return { isValid: false, error: 'Election description is required' };
    }

    if (!data.startDate) {
      return { isValid: false, error: 'Start date is required' };
    }

    if (!data.endDate) {
      return { isValid: false, error: 'End date is required' };
    }

    if (data.endDate <= data.startDate) {
      return { isValid: false, error: 'End date must be after start date' };
    }

    if (!data.candidates || data.candidates.length === 0) {
      return { isValid: false, error: 'At least one candidate is required' };
    }

    return { isValid: true };
  }

  /**
   * Validate candidate data
   */
  private static validateCandidateData(data: CreateCandidateRequest): {
    isValid: boolean;
    error?: string;
  } {
    if (!data.name?.trim()) {
      return { isValid: false, error: 'Candidate name is required' };
    }

    if (!data.party?.trim()) {
      return { isValid: false, error: 'Party name is required' };
    }

    if (!data.symbol?.trim()) {
      return { isValid: false, error: 'Party symbol is required' };
    }

    if (!data.color?.trim()) {
      return { isValid: false, error: 'Party color is required' };
    }

    if (!data.description?.trim()) {
      return { isValid: false, error: 'Candidate description is required' };
    }

    return { isValid: true };
  }
}

