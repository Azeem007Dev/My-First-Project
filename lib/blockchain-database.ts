/**
 * Blockchain Database Service
 * Handles distributed ledger operations - adding vote blocks to all users
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS, VoteBlock } from '@/config/firebase-init';
import {
  VoteBlockchainService,
  GENESIS_BLOCK,
  createGenesisBlock,
  getLastBlock,
  createVoteBlock,
  isValidChain,
  compareChains,
} from '@/services/vote-blockchain-service';

export class BlockchainDatabaseService {
  /**
   * Initialize blockchain for a new election
   * This creates genesis blocks for all existing users
   */
  static async initializeElectionBlockchain(electionId: string): Promise<boolean> {
    try {
      console.log(`Initializing blockchain for election: ${electionId}`);
      
      // Get all users
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        console.log('No users found, election blockchain will be initialized when first user votes');
        return true;
      }

      // Create genesis block for this election
      const genesisBlock = createGenesisBlock(electionId);
      const initialChain = [genesisBlock];

      // Update all users with the new election blockchain
      const batch = writeBatch(db);
      let updatedUsers = 0;

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const currentElectionBlocks = userData.electionBlocks || {};
        
        batch.update(doc.ref, {
          electionBlocks: {
            ...currentElectionBlocks,
            [electionId]: initialChain,
          },
        });
        updatedUsers++;
      });

      await batch.commit();
      console.log(`Election blockchain initialized for ${updatedUsers} users for election ${electionId}`);

      return true;
    } catch (error) {
      console.error('Initialize election blockchain error:', error);
      return false;
    }
  }

  /**
   * Initialize blockchain for a new user (initialize with all existing elections)
   */
  static async initializeUserBlockchain(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error('User not found');
        return false;
      }

      const userData = userDoc.data();
      
      // If user already has election blocks, don't reinitialize
      if (userData.electionBlocks && Object.keys(userData.electionBlocks).length > 0) {
        return true;
      }

      // Get all elections and initialize user with genesis blocks for each
      const electionsSnapshot = await getDocs(collection(db, COLLECTIONS.ELECTIONS));
      const electionBlocks: { [electionId: string]: VoteBlock[] } = {};

      electionsSnapshot.docs.forEach(electionDoc => {
        const electionId = electionDoc.id;
        electionBlocks[electionId] = [createGenesisBlock(electionId)];
      });

      // Update user with election blocks
      await updateDoc(userRef, {
        electionBlocks: electionBlocks,
      });

      console.log(`Initialized blockchain for user ${userId} with ${Object.keys(electionBlocks).length} elections`);
      return true;
    } catch (error) {
      console.error('Initialize user blockchain error:', error);
      return false;
    }
  }

  /**
   * Get consensus blockchain for a specific election
   */
  static async getConsensusBlockchain(electionId: string): Promise<VoteBlock[]> {
    try {
      console.log(`Getting consensus blockchain for election: ${electionId}`);
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        console.log('No users found, returning genesis block for election');
        return [createGenesisBlock(electionId)];
      }

      const chains: VoteBlock[][] = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.electionBlocks && userData.electionBlocks[electionId]) {
          const electionChain = userData.electionBlocks[electionId];
          if (Array.isArray(electionChain) && electionChain.length > 0) {
            console.log(`User ${doc.id} has ${electionChain.length} blocks for election ${electionId}`);
            chains.push(electionChain);
          }
        } else {
          console.log(`User ${doc.id} has no blocks for election ${electionId}`);
        }
      });

      if (chains.length === 0) {
        console.log('No valid chains found, returning genesis block for election');
        return [createGenesisBlock(electionId)];
      }

      // Find the most common chain (consensus)
      const chainMap = new Map<string, { chain: VoteBlock[]; count: number }>();

      chains.forEach(chain => {
        const chainHash = this.getChainHash(chain);
        const existing = chainMap.get(chainHash);
        
        if (existing) {
          existing.count++;
        } else {
          chainMap.set(chainHash, { chain, count: 1 });
        }
      });

      // Get the chain with highest count
      let consensusChain = [GENESIS_BLOCK];
      let maxCount = 0;

      chainMap.forEach(({ chain, count }) => {
        if (count > maxCount) {
          maxCount = count;
          consensusChain = chain;
        }
      });

      return consensusChain;
    } catch (error) {
      console.error('Get consensus blockchain error:', error);
      return [GENESIS_BLOCK];
    }
  }

  /**
   * Get chain hash (for comparing chains)
   */
  private static getChainHash(chain: VoteBlock[]): string {
    return chain.map(block => block.hash).join('|');
  }

  /**
   * Add a vote block to all users' blockchains
   * This is the key function that implements distributed ledger
   */
  static async addVoteBlockToAllUsers(
    electionId: string,
    candidateId: string,
    voterId: string
  ): Promise<{ success: boolean; block?: VoteBlock; error?: string }> {
    try {
      console.log('Adding vote block to all users...');

      // Get consensus blockchain for this specific election
      const currentChain = await this.getConsensusBlockchain(electionId);
      
      // Validate current chain for this election
      console.log(`Validating current chain with ${currentChain.length} blocks for election ${electionId}`);
      if (!isValidChain(currentChain, electionId)) {
        console.error('Blockchain validation failed for election:', electionId, currentChain);
        return { 
          success: false, 
          error: `Blockchain is invalid for election ${electionId}. System integrity compromised.` 
        };
      }
      
      console.log('Blockchain validation passed');

      // Create new block
      const lastBlock = getLastBlock(currentChain);
      const newBlock = createVoteBlock(lastBlock, electionId, candidateId, voterId);
      const updatedChain = [...currentChain, newBlock];

      console.log('New block created:', newBlock);

      // Get all users
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        return { success: false, error: 'No users found in system' };
      }

      // Use batch write to update all users atomically
      const batch = writeBatch(db);
      let updateCount = 0;

      usersSnapshot.docs.forEach(userDoc => {
        const userRef = doc(db, COLLECTIONS.USERS, userDoc.id);
        const userData = userDoc.data();
        const currentElectionBlocks = userData.electionBlocks || {};
        
        batch.update(userRef, {
          electionBlocks: {
            ...currentElectionBlocks,
            [electionId]: updatedChain,
          },
          lastBlockchainUpdate: new Date(),
        });
        updateCount++;
      });

      // Commit batch
      await batch.commit();

      console.log(`Vote block added to ${updateCount} users`);

      return { success: true, block: newBlock };
    } catch (error: any) {
      console.error('Add vote block to all users error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add vote block to blockchain' 
      };
    }
  }

  /**
   * Get user's blockchain
   */
  static async getUserBlockchain(userId: string): Promise<VoteBlock[]> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return [GENESIS_BLOCK];
      }

      const userData = userDoc.data();
      return userData.voteBlocks || [GENESIS_BLOCK];
    } catch (error) {
      console.error('Get user blockchain error:', error);
      return [GENESIS_BLOCK];
    }
  }

  /**
   * Verify blockchain integrity across all users
   * Returns percentage of users with matching blockchains
   */
  static async verifyBlockchainIntegrity(): Promise<{
    isIntegritySafe: boolean;
    matchPercentage: number;
    totalUsers: number;
    consensusChain: VoteBlock[];
    discrepancies: {
      userId: string;
      userName: string;
      chainLength: number;
      lastBlockHash: string;
    }[];
  }> {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      
      if (usersSnapshot.empty) {
        return {
          isIntegritySafe: false,
          matchPercentage: 0,
          totalUsers: 0,
          consensusChain: [GENESIS_BLOCK],
          discrepancies: [],
        };
      }

      // For now, use a placeholder election ID for global integrity check
      // TODO: Update this function to work with election-specific chains
      const consensusChain = await this.getConsensusBlockchain('global-integrity-check');
      const consensusHash = this.getChainHash(consensusChain);

      let matchCount = 0;
      const discrepancies: {
        userId: string;
        userName: string;
        chainLength: number;
        lastBlockHash: string;
      }[] = [];

      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const userChain = userData.voteBlocks || [GENESIS_BLOCK];
        const userChainHash = this.getChainHash(userChain);

        if (userChainHash === consensusHash) {
          matchCount++;
        } else {
          discrepancies.push({
            userId: userDoc.id,
            userName: userData.name || 'Unknown',
            chainLength: userChain.length,
            lastBlockHash: getLastBlock(userChain).hash,
          });
        }
      });

      const totalUsers = usersSnapshot.size;
      const matchPercentage = (matchCount / totalUsers) * 100;

      return {
        isIntegritySafe: matchPercentage >= 95, // 95% consensus means safe
        matchPercentage,
        totalUsers,
        consensusChain,
        discrepancies,
      };
    } catch (error) {
      console.error('Verify blockchain integrity error:', error);
      return {
        isIntegritySafe: false,
        matchPercentage: 0,
        totalUsers: 0,
        consensusChain: [GENESIS_BLOCK],
        discrepancies: [],
      };
    }
  }

  /**
   * Repair user's blockchain (sync with consensus for all elections)
   */
  static async repairUserBlockchain(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      
      // Get all elections and sync user with consensus for each
      const electionsSnapshot = await getDocs(collection(db, COLLECTIONS.ELECTIONS));
      const electionBlocks: { [electionId: string]: VoteBlock[] } = {};

      for (const electionDoc of electionsSnapshot.docs) {
        const electionId = electionDoc.id;
        const consensusChain = await this.getConsensusBlockchain(electionId);
        electionBlocks[electionId] = consensusChain;
      }

      await updateDoc(userRef, {
        electionBlocks: electionBlocks,
      });

      console.log(`Repaired blockchain for user ${userId} across ${Object.keys(electionBlocks).length} elections`);
      return true;
    } catch (error) {
      console.error('Repair user blockchain error:', error);
      return false;
    }
  }

  /**
   * Get blockchain statistics
   */
  static async getBlockchainStatistics(): Promise<{
    totalBlocks: number;
    totalVotes: number;
    integrityStatus: 'safe' | 'warning' | 'critical';
    matchPercentage: number;
  }> {
    try {
      // Get statistics across all elections
      const electionsSnapshot = await getDocs(collection(db, COLLECTIONS.ELECTIONS));
      let totalBlocks = 0;
      let totalVotes = 0;

      for (const electionDoc of electionsSnapshot.docs) {
        const electionId = electionDoc.id;
        const consensusChain = await this.getConsensusBlockchain(electionId);
        totalBlocks += consensusChain.length;
        totalVotes += Math.max(0, consensusChain.length - 1); // Subtract genesis block
      }
      const integrity = await this.verifyBlockchainIntegrity();

      let integrityStatus: 'safe' | 'warning' | 'critical' = 'safe';
      
      if (integrity.matchPercentage < 95) {
        integrityStatus = 'warning';
      }
      if (integrity.matchPercentage < 80) {
        integrityStatus = 'critical';
      }

      return {
        totalBlocks,
        totalVotes,
        integrityStatus,
        matchPercentage: integrity.matchPercentage,
      };
    } catch (error) {
      console.error('Get blockchain statistics error:', error);
      return {
        totalBlocks: 1,
        totalVotes: 0,
        integrityStatus: 'critical',
        matchPercentage: 0,
      };
    }
  }
}

