/**
 * Admin Candidates Service
 * Handles candidate management operations for admin users
 */

import { BaseService, ApiResponse } from './base-service';

export interface AdminCandidate {
  id: string;
  name: string;
  party: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AdminCreateCandidateRequest {
  name: string;
  party: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
}

export interface AdminUpdateCandidateRequest {
  name?: string;
  party?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;
}

export interface GetCandidatesResponse extends ApiResponse {
  candidates?: AdminCandidate[];
  count?: number;
}

export interface CandidateResponse extends ApiResponse {
  candidate?: AdminCandidate;
  message?: string;
}

export class AdminCandidatesService extends BaseService {
  /**
   * Get all candidates
   * 
   * @returns Promise with all candidates
   */
  static async getCandidates(): Promise<GetCandidatesResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<GetCandidatesResponse>('/api/admin/candidates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Get candidates error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get candidates',
        candidates: [],
        count: 0,
      };
    }
  }

  /**
   * Create a new candidate
   * 
   * @param candidateData - Candidate information
   * @returns Promise with created candidate
   */
  static async createCandidate(candidateData: AdminCreateCandidateRequest): Promise<CandidateResponse> {
    try {
      // Validate candidate data
      const validation = this.validateCandidateData(candidateData);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<CandidateResponse>('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(candidateData),
      });

      return response;
    } catch (error: any) {
      console.error('Create candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create candidate',
      };
    }
  }

  /**
   * Update an existing candidate
   * 
   * @param candidateId - ID of the candidate to update
   * @param updateData - Updated candidate information
   * @returns Promise with updated candidate
   */
  static async updateCandidate(
    candidateId: string,
    updateData: AdminUpdateCandidateRequest
  ): Promise<CandidateResponse> {
    try {
      // Validate candidate data
      const validation = this.validateCandidateData(updateData, true);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<CandidateResponse>(`/api/admin/candidates/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      return response;
    } catch (error: any) {
      console.error('Update candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update candidate',
      };
    }
  }

  /**
   * Delete a candidate
   * 
   * @param candidateId - ID of the candidate to delete
   * @returns Promise with deletion result
   */
  static async deleteCandidate(candidateId: string): Promise<ApiResponse> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await this.fetchApi<ApiResponse>(`/api/admin/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error: any) {
      console.error('Delete candidate error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete candidate',
      };
    }
  }

  /**
   * Validate candidate data
   */
  private static validateCandidateData(
    data: AdminCreateCandidateRequest | AdminUpdateCandidateRequest,
    isUpdate: boolean = false
  ): {
    isValid: boolean;
    error?: string;
  } {
    // For updates, at least one field must be provided
    if (isUpdate && !data.name && !data.party && !data.symbol && !data.description && !data.imageUrl) {
      return { isValid: false, error: 'At least one field must be provided for update' };
    }

    // Validate name
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        return { isValid: false, error: 'Candidate name is required' };
      }
      if (data.name.trim().length < 2) {
        return { isValid: false, error: 'Candidate name must be at least 2 characters' };
      }
      if (data.name.trim().length > 100) {
        return { isValid: false, error: 'Candidate name must not exceed 100 characters' };
      }
    }

    // Validate party
    if (data.party !== undefined) {
      if (!data.party.trim()) {
        return { isValid: false, error: 'Party name is required' };
      }
      if (data.party.trim().length < 2) {
        return { isValid: false, error: 'Party name must be at least 2 characters' };
      }
      if (data.party.trim().length > 100) {
        return { isValid: false, error: 'Party name must not exceed 100 characters' };
      }
    }

    // Validate symbol
    if (data.symbol !== undefined) {
      if (!data.symbol.trim()) {
        return { isValid: false, error: 'Symbol is required' };
      }
      if (data.symbol.trim().length > 10) {
        return { isValid: false, error: 'Symbol must not exceed 10 characters' };
      }
    }

    // Validate description
    if (data.description !== undefined && data.description.length > 500) {
      return { isValid: false, error: 'Description must not exceed 500 characters' };
    }

    // Validate image URL
    if (data.imageUrl !== undefined && data.imageUrl.trim()) {
      try {
        new URL(data.imageUrl.trim());
      } catch {
        return { isValid: false, error: 'Invalid image URL format' };
      }
    }

    return { isValid: true };
  }
}
