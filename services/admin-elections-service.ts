/**
 * Admin Elections Service
 * Handles administrative election operations with real-time updates
 */

import { BaseService, ApiResponse } from './base-service';

export interface AdminElection {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[];
  createdAt: Date;
  updatedAt: Date;
  totalVotes?: number;
  totalVoters?: number;
  turnoutPercentage?: number;
}

export interface CreateElectionRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  candidates: string[];
}

export interface UpdateElectionStatusRequest {
  status: 'upcoming' | 'active' | 'ended';
}

export interface DeployResultsRequest {
  electionId: string;
}

export interface GetElectionsResponse extends ApiResponse {
  elections?: AdminElection[];
}

export interface ElectionResponse extends ApiResponse {
  election?: AdminElection;
}

export interface ElectionStatsResponse extends ApiResponse {
  stats?: {
    totalVoters: number;
    totalVotes: number;
    turnoutPercentage: number;
    status: 'upcoming' | 'active' | 'ended';
  };
}

export interface AdminStatsResponse extends ApiResponse {
  stats?: {
    overview: {
      totalUsers: number;
      totalElections: number;
      totalVotesAllTime: number;
      totalCandidates: number;
      userGrowthPercentage: number;
      newUsersThisMonth: number;
    };
    activeElection: {
      totalVotes: number;
      totalVoters: number;
      turnoutPercentage: number;
      status: 'upcoming' | 'active' | 'ended';
      electionTitle: string;
      electionId: string | null;
    };
    system: {
      uptimePercentage: number;
      databaseStatus: string;
      blockchainStatus: string;
    };
  };
}

export class AdminElectionsService extends BaseService {
  private static readonly BASE_URL = '/api/admin/elections';

  /**
   * Get all elections
   */
  static async getElections(): Promise<GetElectionsResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<GetElectionsResponse>(
        this.BASE_URL,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Get elections error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch elections',
      };
    }
  }

  /**
   * Get a single election by ID
   */
  static async getElection(id: string): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        `${this.BASE_URL}/${id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Get election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch election',
      };
    }
  }

  /**
   * Create a new election
   */
  static async createElection(data: CreateElectionRequest): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        this.BASE_URL,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error: any) {
      console.error('Create election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create election',
      };
    }
  }

  /**
   * Update election status (activate, close)
   */
  static async updateElectionStatus(
    id: string,
    status: 'upcoming' | 'active' | 'ended'
  ): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        `${this.BASE_URL}/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      return response;
    } catch (error: any) {
      console.error('Update election status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update election status',
      };
    }
  }

  /**
   * Deploy election results
   */
  static async deployResults(id: string): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        `${this.BASE_URL}/${id}/deploy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Deploy results error:', error);
      return {
        success: false,
        error: error.message || 'Failed to deploy results',
      };
    }
  }

  /**
   * Update an election
   */
  static async updateElection(id: string, data: CreateElectionRequest): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        `${this.BASE_URL}/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response;
    } catch (error: any) {
      console.error('Update election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update election',
      };
    }
  }

  /**
   * Delete an election
   */
  static async deleteElection(id: string): Promise<ApiResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ApiResponse>(
        `${this.BASE_URL}/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Delete election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete election',
      };
    }
  }

  /**
   * Get election statistics
   */
  static async getElectionStats(id: string): Promise<ElectionStatsResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionStatsResponse>(
        `${this.BASE_URL}/${id}/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Get election stats error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch election statistics',
      };
    }
  }

  /**
   * Get active election
   */
  static async getActiveElection(): Promise<ElectionResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<ElectionResponse>(
        `${this.BASE_URL}/active`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Get active election error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch active election',
      };
    }
  }

  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<AdminStatsResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await this.fetchApi<AdminStatsResponse>(
        '/api/admin/stats',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response;
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch admin statistics',
      };
    }
  }
}

