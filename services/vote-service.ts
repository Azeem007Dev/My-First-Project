/**
 * Vote Service
 * Handles voting operations and election data
 */

import { BaseService } from './base-service';

export interface CastVoteRequest {
  voterId: string;
  candidateId: string;
  electionId: string;
}

export interface CastVoteResponse {
  success: boolean;
  error?: string;
  voteId?: string;
}

export interface Election {
  id?: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  candidates: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id?: string;
  name: string;
  party: string;
  symbol: string;
  color: string;
  description: string;
}

export interface VoteCount {
  electionId: string;
  candidateId: string;
  count: number;
  lastUpdated: Date;
}

export class VoteService extends BaseService {
  /**
   * Cast a vote for a candidate in an election
   * 
   * @param voteData - Vote information
   * @returns Promise with cast vote response
   */
  static async castVote(voteData: CastVoteRequest): Promise<CastVoteResponse> {
    try {
      // Import DatabaseService for client-side operations
      const { DatabaseService } = await import('@/lib/database');
      
      const result = await DatabaseService.castVote(voteData);
      
      return result;
    } catch (error: any) {
      console.error('Cast vote error:', error);
      return {
        success: false,
        error: error.message || 'Failed to cast vote. Please try again.',
      };
    }
  }

  /**
   * Get all elections
   */
  static async getElections(): Promise<Election[]> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getElections();
    } catch (error) {
      console.error('Get elections error:', error);
      return [];
    }
  }

  /**
   * Get active election
   */
  static async getActiveElection(): Promise<Election | null> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getActiveElection();
    } catch (error) {
      console.error('Get active election error:', error);
      return null;
    }
  }

  /**
   * Get all candidates
   */
  static async getCandidates(): Promise<Candidate[]> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getCandidates();
    } catch (error) {
      console.error('Get candidates error:', error);
      return [];
    }
  }

  /**
   * Check if user has already voted in an election
   */
  static async hasUserVoted(voterId: string, electionId: string): Promise<boolean> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      const vote = await DatabaseService.getUserVote(voterId, electionId);
      return !!vote;
    } catch (error) {
      console.error('Check user voted error:', error);
      return false;
    }
  }

  /**
   * Get vote counts for an election
   */
  static async getVoteCounts(electionId: string): Promise<VoteCount[]> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getVoteCounts(electionId);
    } catch (error) {
      console.error('Get vote counts error:', error);
      return [];
    }
  }

  /**
   * Get voting statistics for an election
   */
  static async getVoteStatistics(electionId: string): Promise<{
    totalVotes: number;
    candidateResults: { candidateId: string; candidateName: string; votes: number }[];
  }> {
    try {
      const { DatabaseService } = await import('@/lib/database');
      return await DatabaseService.getVoteStatistics(electionId);
    } catch (error) {
      console.error('Get vote statistics error:', error);
      return { totalVotes: 0, candidateResults: [] };
    }
  }

  /**
   * Validate if voting is allowed for an election
   */
  static validateVoting(election: Election): { isValid: boolean; error?: string } {
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (election.status !== 'active') {
      return { isValid: false, error: 'Election is not active' };
    }

    if (now < startDate) {
      return { isValid: false, error: 'Election has not started yet' };
    }

    if (now > endDate) {
      return { isValid: false, error: 'Election has ended' };
    }

    if (!election.candidates || election.candidates.length === 0) {
      return { isValid: false, error: 'No candidates available for this election' };
    }

    return { isValid: true };
  }
}

