import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  VoteLedgerUser, 
  Candidate, 
  Election, 
  Vote, 
  VoteCount,
  VoteBlock,
  COLLECTIONS 
} from '@/config/firebase-init';

// Database service for Vote Ledger
export class DatabaseService {
  // User operations
  static async updateUserProfile(uid: string, data: Partial<VoteLedgerUser>): Promise<boolean> {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Update user profile error:', error);
      return false;
    }
  }

  // Candidate operations
  static async createCandidate(candidate: Omit<Candidate, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CANDIDATES), candidate);
      return docRef.id;
    } catch (error) {
      console.error('Create candidate error:', error);
      return null;
    }
  }

  static async getCandidates(): Promise<Candidate[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CANDIDATES));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Candidate[];
    } catch (error) {
      console.error('Get candidates error:', error);
      return [];
    }
  }

  static async updateCandidate(id: string, data: Partial<Candidate>): Promise<boolean> {
    try {
      await updateDoc(doc(db, COLLECTIONS.CANDIDATES, id), data);
      return true;
    } catch (error) {
      console.error('Update candidate error:', error);
      return false;
    }
  }

  static async deleteCandidate(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, id));
      return true;
    } catch (error) {
      console.error('Delete candidate error:', error);
      return false;
    }
  }

  // Election operations
  static async createElection(election: Omit<Election, 'id'>): Promise<string | null> {
    try {
      // Convert Date objects to Timestamps for Firestore
      const electionData = {
        ...election,
        startDate: election.startDate instanceof Date ? Timestamp.fromDate(election.startDate) : election.startDate,
        endDate: election.endDate instanceof Date ? Timestamp.fromDate(election.endDate) : election.endDate,
        createdAt: election.createdAt instanceof Date ? Timestamp.fromDate(election.createdAt) : serverTimestamp(),
        updatedAt: election.updatedAt instanceof Date ? Timestamp.fromDate(election.updatedAt) : serverTimestamp(),
        // Initialize vote statistics
        totalVotes: 0,
        totalVoters: 0,
        turnoutPercentage: 0,
      };
      
      console.log('Saving election to database:', electionData);
      const docRef = await addDoc(collection(db, COLLECTIONS.ELECTIONS), electionData);
      console.log('Election saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Create election error:', error);
      console.error('Election data:', election);
      return null;
    }
  }

  static async getElections(): Promise<Election[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.ELECTIONS), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: (doc.data().startDate as Timestamp)?.toDate(),
        endDate: (doc.data().endDate as Timestamp)?.toDate(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as Election[];
    } catch (error) {
      console.error('Get elections error:', error);
      return [];
    }
  }

  static async getActiveElection(): Promise<Election | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ELECTIONS),
        where('status', '==', 'active'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: (data.startDate as Timestamp)?.toDate(),
          endDate: (data.endDate as Timestamp)?.toDate(),
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
        } as Election;
      }
      return null;
    } catch (error) {
      console.error('Get active election error:', error);
      return null;
    }
  }

  static async updateElection(id: string, data: Partial<Election>): Promise<boolean> {
    try {
      console.log('Updating election:', id, 'with data:', data);
      await updateDoc(doc(db, COLLECTIONS.ELECTIONS, id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      console.log('Election updated successfully');
      return true;
    } catch (error) {
      console.error('Update election error:', error);
      return false;
    }
  }

  static async deleteElection(id: string): Promise<boolean> {
    try {
      console.log('Deleting election:', id);
      
      // Check if election has votes
      const votes = await this.getVotesByElection(id);
      if (votes.length > 0) {
        console.log('Cannot delete election with existing votes');
        return false;
      }

      // Delete vote counts for this election
      const voteCountsQuery = query(
        collection(db, COLLECTIONS.VOTE_COUNTS),
        where('electionId', '==', id)
      );
      const voteCountsSnapshot = await getDocs(voteCountsQuery);
      
      for (const docSnapshot of voteCountsSnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
      }

      // Delete the election
      await deleteDoc(doc(db, COLLECTIONS.ELECTIONS, id));
      console.log('Election deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete election error:', error);
      return false;
    }
  }

  // Vote operations
  static async castVote(vote: Omit<Vote, 'id' | 'timestamp'>): Promise<{ success: boolean; voteId?: string; blockHash?: string; error?: string }> {
    try {
      // Check if user has already voted in this election
      const existingVote = await this.getUserVote(vote.voterId, vote.electionId);
      if (existingVote) {
        return { success: false, error: 'You have already voted in this election' };
      }

      console.log('Casting vote:', vote);

      // Add vote to blockchain (distributed ledger)
      const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
      const blockchainResult = await BlockchainDatabaseService.addVoteBlockToAllUsers(
        vote.electionId,
        vote.candidateId,
        vote.voterId
      );

      if (!blockchainResult.success) {
        console.error('Blockchain add failed:', blockchainResult.error);
        return { success: false, error: blockchainResult.error || 'Failed to add vote to blockchain' };
      }

      console.log('Vote added to blockchain:', blockchainResult.block?.hash);

      // Create vote document with blockchain hash
      const docRef = await addDoc(collection(db, COLLECTIONS.VOTES), {
        ...vote,
        timestamp: serverTimestamp(),
        transactionHash: blockchainResult.block?.hash,
      });

      console.log('Vote created with ID:', docRef.id);

      // Update vote count
      await this.updateVoteCount(vote.electionId, vote.candidateId, 1);

      // Update election statistics
      await this.updateElectionStats(vote.electionId);

      console.log('Vote cast successfully');
      return { 
        success: true, 
        voteId: docRef.id,
        blockHash: blockchainResult.block?.hash,
      };
    } catch (error: any) {
      console.error('Cast vote error:', error);
      return { success: false, error: error.message || 'Failed to cast vote' };
    }
  }

  static async getUserVote(voterId: string, electionId: string): Promise<Vote | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.VOTES),
        where('voterId', '==', voterId),
        where('electionId', '==', electionId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate(),
        } as Vote;
      }
      return null;
    } catch (error) {
      console.error('Get user vote error:', error);
      return null;
    }
  }

  static async getVotesByElection(electionId: string): Promise<Vote[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.VOTES),
        where('electionId', '==', electionId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate(),
        } as Vote;
      });
    } catch (error) {
      console.error('Get votes by election error:', error);
      return [];
    }
  }

  // Vote count operations
  static async updateVoteCount(electionId: string, candidateId: string, increment: number): Promise<boolean> {
    try {
      const voteCountRef = doc(db, COLLECTIONS.VOTE_COUNTS, `${electionId}_${candidateId}`);
      const voteCountDoc = await getDoc(voteCountRef);
      
      if (voteCountDoc.exists()) {
        const currentCount = voteCountDoc.data().count || 0;
        await updateDoc(voteCountRef, {
          count: currentCount + increment,
          lastUpdated: serverTimestamp(),
        });
      } else {
        await setDoc(voteCountRef, {
          electionId,
          candidateId,
          count: increment,
          lastUpdated: serverTimestamp(),
        });
      }
      return true;
    } catch (error) {
      console.error('Update vote count error:', error);
      return false;
    }
  }

  static async getVoteCounts(electionId: string): Promise<VoteCount[]> {
    try {
      // First try with orderBy, if it fails due to missing index, fall back to simple query
      try {
        const q = query(
          collection(db, COLLECTIONS.VOTE_COUNTS),
          where('electionId', '==', electionId),
          orderBy('count', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            lastUpdated: (data.lastUpdated as Timestamp)?.toDate(),
          } as VoteCount;
        });
      } catch (indexError: any) {
        // If index error, use simple query without orderBy
        if (indexError.code === 'failed-precondition') {
          console.log('Index not found, using simple query for vote counts');
          const q = query(
            collection(db, COLLECTIONS.VOTE_COUNTS),
            where('electionId', '==', electionId)
          );
          const querySnapshot = await getDocs(q);
          
          const voteCounts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              lastUpdated: (data.lastUpdated as Timestamp)?.toDate(),
            } as VoteCount;
          });
          
          // Sort manually by count in descending order
          return voteCounts.sort((a, b) => b.count - a.count);
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Get vote counts error:', error);
      return [];
    }
  }

  // Admin operations
  static async getAllUsers(): Promise<VoteLedgerUser[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as VoteLedgerUser[];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  // Get all non-admin users (for voter statistics)
  static async getNonAdminUsers(): Promise<VoteLedgerUser[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.USERS),
          where('isAdmin', '==', false)
        )
      );
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
      })) as VoteLedgerUser[];
    } catch (error) {
      console.error('Error getting non-admin users:', error);
      // Fallback: filter manually if query fails
      try {
        const allUsers = await this.getAllUsers();
        return allUsers.filter(user => !user.isAdmin);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  static async getVoteStatistics(electionId: string): Promise<{
    totalVotes: number;
    candidateResults: { candidateId: string; candidateName: string; votes: number }[];
  }> {
    try {
      console.log('Getting vote statistics for election:', electionId);
      
      // Get votes from both voteCounts collection and blockchain for verification
      const voteCounts = await this.getVoteCounts(electionId);
      const blockchainStats = await this.getBlockchainVoteStatistics(electionId);
      
      const candidates = await this.getCandidates();
      
      // Use blockchain as primary source if voteCounts is empty or inconsistent
      let totalVotes: number;
      let candidateResults: { candidateId: string; candidateName: string; votes: number }[];
      
      const voteCountsTotal = voteCounts.reduce((sum, count) => sum + count.count, 0);
      
      if (voteCountsTotal > 0 && Math.abs(voteCountsTotal - blockchainStats.totalVotes) <= 1) {
        // Use voteCounts if it has data and is consistent with blockchain
        totalVotes = voteCountsTotal;
        candidateResults = voteCounts.map(count => {
          const candidate = candidates.find(c => c.id === count.candidateId);
          return {
            candidateId: count.candidateId,
            candidateName: candidate?.name || 'Unknown',
            votes: count.count,
          };
        });
      } else {
        // Use blockchain data if voteCounts is empty or inconsistent
        console.log('Using blockchain data for vote statistics');
        totalVotes = blockchainStats.totalVotes;
        candidateResults = blockchainStats.candidateResults.map(result => {
          const candidate = candidates.find(c => c.id === result.candidateId);
          return {
            candidateId: result.candidateId,
            candidateName: candidate?.name || 'Unknown',
            votes: result.votes,
          };
        });
      }

      console.log('Vote statistics:', { 
        totalVotes, 
        candidateResults,
        voteCountsTotal,
        blockchainVotes: blockchainStats.totalVotes,
        source: voteCountsTotal > 0 ? 'voteCounts' : 'blockchain'
      });
      
      return { totalVotes, candidateResults };
    } catch (error) {
      console.error('Get vote statistics error:', error);
      return { totalVotes: 0, candidateResults: [] };
    }
  }

  // Get vote statistics from blockchain
  static async getBlockchainVoteStatistics(electionId: string): Promise<{
    totalVotes: number;
    candidateResults: { candidateId: string; votes: number }[];
  }> {
    try {
      // Get consensus blockchain for this election
      const { BlockchainDatabaseService } = await import('@/lib/blockchain-database');
      const consensusChain = await BlockchainDatabaseService.getConsensusBlockchain(electionId);
      
      // Count votes from blockchain
      const voteMap = new Map<string, number>();
      
      consensusChain.forEach(block => {
        if (block.index > 0 && block.electionId === electionId) {
          const candidateId = block.voteData.candidateId;
          voteMap.set(candidateId, (voteMap.get(candidateId) || 0) + 1);
        }
      });
      
      const totalVotes = Array.from(voteMap.values()).reduce((sum, count) => sum + count, 0);
      const candidateResults = Array.from(voteMap.entries()).map(([candidateId, votes]) => ({
        candidateId,
        votes,
      }));
      
      return { totalVotes, candidateResults };
    } catch (error) {
      console.error('Get blockchain vote statistics error:', error);
      return { totalVotes: 0, candidateResults: [] };
    }
  }

  // Update election statistics in the database
  static async updateElectionStats(electionId: string): Promise<boolean> {
    try {
      console.log('Updating election stats for:', electionId);
      const stats = await this.getVoteStatistics(electionId);
      // Use non-admin users only for voter statistics
      const voters = await this.getNonAdminUsers();
      
      const totalVoters = voters.length;
      const totalVotes = stats.totalVotes;
      const turnoutPercentage = totalVoters > 0 
        ? Math.round((totalVotes / totalVoters) * 100 * 10) / 10
        : 0;

      console.log('Calculated stats:', { totalVoters, totalVotes, turnoutPercentage });

      await updateDoc(doc(db, COLLECTIONS.ELECTIONS, electionId), {
        totalVotes,
        totalVoters,
        turnoutPercentage,
        updatedAt: serverTimestamp(),
      });

      console.log('Election stats updated successfully');
      return true;
    } catch (error) {
      console.error('Update election stats error:', error);
      return false;
    }
  }

  // Force refresh all election statistics (useful for admin operations)
  static async refreshAllElectionStats(): Promise<boolean> {
    try {
      console.log('Refreshing all election statistics...');
      const elections = await this.getElections();
      
      for (const election of elections) {
        if (election.id) {
          await this.updateElectionStats(election.id);
        }
      }
      
      console.log('All election statistics refreshed successfully');
      return true;
    } catch (error) {
      console.error('Refresh all election stats error:', error);
      return false;
    }
  }
}
